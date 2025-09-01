# orders/views.py

from django.utils import timezone
from django.db.models import Sum, F, DecimalField, Case, When, Value, IntegerField
from django.db import models, transaction
from datetime import timedelta, datetime, date
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

# Import all models needed
from .models import Order, OrderItem, ORDER_STATUS
from customers.models import Customer
from menu.models import Dish, DishIngredient
from billing.models import Bill
from tables.models import Table
from inventory.models import Ingredient
from decimal import Decimal
# Import all serializers needed
from .serializers import (
    OrderSerializer, 
    RecentOrderSerializer, 
    MyTokenObtainPairSerializer, 
    OrderWriteSerializer,
    DashboardOrderSerializer
)

# --- VIEW 1: For Customer Self-Service Orders ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    """
    Handles orders placed by customers through the customer-facing app.
    This version is more secure and robust.
    """
    request_data = request.data.copy()
    
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        request_data['customer'] = customer.id 
        request_data.pop('customer_id', None)

        # --- FIX: Transform item data to match the serializer ---
        # The frontend sends 'dish_id', but the serializer expects 'dish'.
        if 'items' in request_data:
            for item in request_data['items']:
                if 'dish_id' in item:
                    item['dish'] = item.pop('dish_id')

    except Customer.DoesNotExist:
        return Response({'error': 'Customer profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = OrderWriteSerializer(data=request_data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            order = serializer.save()
            
            for item in order.items.all():
                dish = item.dish
                quantity_ordered = item.quantity
                required_ingredients = DishIngredient.objects.filter(dish=dish)

                for recipe_item in required_ingredients:
                    ingredient = recipe_item.ingredient
                    quantity_needed = recipe_item.quantity_required * quantity_ordered
                    if ingredient.current_stock < quantity_needed:
                        raise Exception(f"Not enough stock for {ingredient.name} to make {dish.name}.")
                    ingredient.current_stock -= quantity_needed
                    ingredient.save()

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- VIEW 2: For Staff POS Orders ---
@api_view(['POST'])
@permission_classes([IsAdminUser]) # Only staff can access this
def place_pos_order(request):
    """
    Handles orders placed by staff through the admin POS interface.
    """
    serializer = OrderWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if not serializer.validated_data.get('customer'):
        customer, _ = Customer.objects.get_or_create(phone_number='0000000000')
        serializer.validated_data['customer'] = customer

    try:
        with transaction.atomic():
            order = serializer.save()
            # --- FIX: Corrected inventory deduction logic ---
            for item in order.items.all():
                dish = item.dish
                quantity_ordered = item.quantity
                required_ingredients = DishIngredient.objects.filter(dish=dish)

                for recipe_item in required_ingredients:
                    ingredient = recipe_item.ingredient
                    quantity_needed = recipe_item.quantity_required * quantity_ordered
                    if ingredient.current_stock < quantity_needed:
                        raise Exception(f"Not enough stock for {ingredient.name} to make {dish.name}.")
                    ingredient.current_stock -= quantity_needed
                    ingredient.save()

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def order_history(request, phone_number):
    try:
        customer = Customer.objects.get(phone_number=phone_number)
        orders = Order.objects.filter(customer=customer).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def repeat_order(request, order_id):
    try:
        old_order = Order.objects.get(id=order_id)
        new_order = Order.objects.create(customer=old_order.customer)
        for item in old_order.items.all():
            OrderItem.objects.create(order=new_order, dish=item.dish, quantity=item.quantity)
        serializer = OrderSerializer(new_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def kitchen_orders(request):
    orders = Order.objects.filter(status__in=['Pending', 'Preparing']).order_by('created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_summary(request):
    """
    Provides an enhanced summary of key metrics for the admin dashboard.
    --- FIX: Now includes total discounts given today. ---
    """
    today = timezone.now().date()

    todays_orders_count = Order.objects.filter(created_at__date=today).count()
    pending_orders_count = Order.objects.filter(status='Pending').count()
    total_dishes_count = Dish.objects.count()

    paid_revenue_today = Decimal('0.00')
    total_discounts_today = Decimal('0.00') # --- NEW: Initialize discount total ---
    
    paid_bills_today = Bill.objects.filter(is_paid=True, paid_at__date=today)
    for bill in paid_bills_today:
        gross_total = OrderItem.objects.filter(order__bill=bill).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total'] or Decimal('0.00')
        
        net_total = gross_total - bill.discount_amount
        paid_revenue_today += net_total
        
        # --- NEW: Add the bill's discount to the daily total ---
        total_discounts_today += bill.discount_amount

    unpaid_revenue = Decimal('0.00')
    unpaid_bills = Bill.objects.filter(is_paid=False)
    for bill in unpaid_bills:
        gross_total = OrderItem.objects.filter(order__bill=bill).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total'] or Decimal('0.00')

        net_total = gross_total - bill.discount_amount
        unpaid_revenue += net_total

    data = {
        'todays_orders': todays_orders_count,
        'pending_orders': pending_orders_count,
        'total_dishes': total_dishes_count,
        'paid_revenue_today': paid_revenue_today,
        'unpaid_revenue': unpaid_revenue,
        'total_discounts_today': total_discounts_today, # --- NEW: Add to response ---
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def daily_sales_chart(request):
    today = timezone.now().date()
    seven_days_ago = today - timedelta(days=6)
    sales_data = OrderItem.objects.filter(
        order__created_at__date__gte=seven_days_ago,
    ).annotate(
        date=models.functions.TruncDate('order__created_at')
    ).values('date').annotate(
        daily_revenue=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
    ).order_by('date')

    date_range = [seven_days_ago + timedelta(days=i) for i in range(7)]
    sales_map = {date.strftime('%Y-%m-%d'): 0 for date in date_range}

    for entry in sales_data:
        sales_map[entry['date'].strftime('%Y-%m-%d')] = float(entry['daily_revenue'])

    chart_data = [{'date': date, 'revenue': revenue} for date, revenue in sales_map.items()]
    return Response(chart_data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def recent_orders(request):
    today = timezone.now().date()
    status_order = Case(
        When(status='Pending', then=Value(1)),
        When(status='Preparing', then=Value(2)),
        When(status='Ready', then=Value(3)),
        When(status='Served', then=Value(4)),
        default=Value(5),
        output_field=IntegerField(),
    )
    orders = Order.objects.filter(created_at__date=today).annotate(
        status_order=status_order
    ).order_by('status_order', '-created_at')
    serializer = OrderSerializer(orders, many=True) 
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kitchen_display_orders(request):
    """
    A view for staff to see all active orders that require action.
    --- FIX: Now uses a "business day" logic to handle late-night orders. ---
    """
    now = timezone.now()
    
    # Define the cutoff hour for a new "business day" (e.g., 5 AM)
    cutoff_hour = 5 

    if now.hour < cutoff_hour:
        # If it's currently between midnight and 5 AM, the business day started yesterday at 5 AM.
        start_of_business_day = now.replace(hour=cutoff_hour, minute=0, second=0, microsecond=0) - timedelta(days=1)
    else:
        # If it's after 5 AM, the business day started today at 5 AM.
        start_of_business_day = now.replace(hour=cutoff_hour, minute=0, second=0, microsecond=0)

    active_statuses = ['Pending', 'Preparing', 'Ready']
    
    # Fetch all active orders since the start of the current business day.
    orders = Order.objects.filter(
        status__in=active_statuses,
        created_at__gte=start_of_business_day
    ).order_by('created_at')
    
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """
    Allows staff to update the status of an order.
    --- FIX: Now checks against the business day, not just the calendar day. ---
    """
    try:
        order = Order.objects.get(id=order_id)
        
        now = timezone.now()
        cutoff_hour = 5
        if now.hour < cutoff_hour:
            start_of_business_day = now.replace(hour=cutoff_hour, minute=0, second=0, microsecond=0) - timedelta(days=1)
        else:
            start_of_business_day = now.replace(hour=cutoff_hour, minute=0, second=0, microsecond=0)

        # Prevent updating orders from a previous business day.
        if order.created_at < start_of_business_day:
            return Response(
                {'error': 'Cannot update an order from a previous business day.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        valid_statuses = [s[0] for s in ORDER_STATUS]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        
        if new_status and new_status.lower() == 'served':
            try:
                table = Table.objects.get(table_number=order.table_number)
                active_bill, created = Bill.objects.get_or_create(table=table, is_paid=False)
                order.bill = active_bill
            except Table.DoesNotExist:
                return Response({'error': f'Table {order.table_number} not found.'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'An unexpected error occurred during billing.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        order.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_orders_list(request):
    queryset = Order.objects.all().order_by('-created_at')
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)

    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        queryset = queryset.filter(created_at__date__gte=start_date)

    if end_date_str:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        queryset = queryset.filter(created_at__date__lte=end_date)

    serializer = OrderSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_status(request, order_id):
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        order = Order.objects.get(id=order_id, customer=customer)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or permission denied.'}, status=status.HTTP_404_NOT_FOUND)
    except AttributeError:
        return Response({'error': 'Invalid user profile.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_order_history(request):
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        status_order = Case(
            When(status='Pending', then=Value(1)),
            When(status='Preparing', then=Value(2)),
            When(status='Ready', then=Value(3)),
            When(status='Served', bill__is_paid=False, then=Value(4)),
            When(status='Served', bill__is_paid=True, then=Value(5)),
            default=Value(6),
            output_field=IntegerField(),
        )
        orders = Order.objects.filter(customer=customer).annotate(
            status_order=status_order
        ).order_by('status_order', '-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer profile not found'}, status=status.HTTP_404_NOT_FOUND)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def live_orders_list(request):
    """
    Returns a list of all active orders from today for the dashboard.
    """
    today = timezone.now().date()
    active_orders = Order.objects.filter(
        created_at__date=today,
        status__in=['Pending', 'Preparing', 'Ready']
    ).order_by('created_at')
    
    # We can reuse the RecentOrderSerializer for this
    serializer = RecentOrderSerializer(active_orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_recent_orders(request):
    """
    Provides a detailed list of today's orders specifically for the admin dashboard,
    including full financial details from the associated bill.
    """
    today = timezone.now().date()
    
    # You can reuse your ordering logic if you wish
    status_order = Case(
        When(status='Pending', then=Value(1)),
        When(status='Preparing', then=Value(2)),
        When(status='Ready', then=Value(3)),
        When(status='Served', then=Value(4)),
        default=Value(5),
        output_field=IntegerField(),
    )
    
    orders = Order.objects.filter(created_at__date=today).select_related(
        'bill', 'customer'
    ).prefetch_related('items__dish').annotate(
        status_order=status_order
    ).order_by('status_order', '-created_at')

    # ✨ Use the new, correct serializer
    serializer = DashboardOrderSerializer(orders, many=True)
    return Response(serializer.data)