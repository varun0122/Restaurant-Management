# orders/views.py

# FIXED: Added all necessary imports
from django.utils import timezone
from django.db.models import Sum, F, DecimalField,Case,When,Value,IntegerField
from django.db import models
from datetime import timedelta,datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
# Import all models needed in this file
from .models import Order, OrderItem,ORDER_STATUS
from customers.models import Customer
from menu.models import Dish
from rest_framework_simplejwt.views import TokenObtainPairView
# Import the serializer
from .serializers import OrderSerializer,RecentOrderSerializer,MyTokenObtainPairSerializer,OrderWriteSerializer
from billing.models import Bill
from tables.models import Table
from datetime import date
@api_view(['POST'])
def place_order(request):
    """
    Creates a new order using the write-only serializer and returns
    the complete order data using the read-only serializer.
    """
    # Use the serializer designed for creating orders
    serializer = OrderWriteSerializer(data=request.data)
    if serializer.is_valid():
        # .save() will call the .create() method in your serializer
        order = serializer.save()
        # Use the main OrderSerializer to return the newly created order with full details
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
def order_history(request, phone_number):
    try:
        customer = Customer.objects.get(phone_number=phone_number)
        orders = Order.objects.filter(customer=customer).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)


# BEST PRACTICE: Changed from GET to POST
@api_view(['POST'])
def repeat_order(request, order_id):
    try:
        old_order = Order.objects.get(id=order_id)
        
        # Create a new order for the same customer
        new_order = Order.objects.create(customer=old_order.customer)
        
        # Copy all items from the old order to the new one
        for item in old_order.items.all():
            OrderItem.objects.create(order=new_order, dish=item.dish, quantity=item.quantity)
            
        # Serialize the new order to return it in the response
        serializer = OrderSerializer(new_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
# You should protect this view so only staff can see it
@permission_classes([IsAdminUser]) # Or create a custom IsStaff permission
def kitchen_orders(request):
    # Shows orders that the kitchen needs to act on
    orders = Order.objects.filter(status__in=['Pending', 'Preparing']).order_by('created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_summary(request):
    """
    Provides an enhanced summary of key metrics for the admin dashboard.
    This version uses a corrected method to calculate revenue.
    """
    today = timezone.now().date()

    # --- Metrics that are unchanged ---
    todays_orders_count = Order.objects.filter(created_at__date=today).count()
    pending_orders_count = Order.objects.filter(status='Pending').count()
    total_dishes_count = Dish.objects.count()

    # --- NEW, CORRECTED CALCULATION for Paid Revenue Today ---
    paid_revenue_today = 0
    paid_bills_today = Bill.objects.filter(is_paid=True, paid_at__date=today)
    for bill in paid_bills_today:
        # Calculate the total for each bill individually and add it to the sum
        total = OrderItem.objects.filter(order__bill=bill).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total'] or 0
        paid_revenue_today += total

    # --- NEW, CORRECTED CALCULATION for Total Unpaid Revenue ---
    unpaid_revenue = 0
    unpaid_bills = Bill.objects.filter(is_paid=False)
    for bill in unpaid_bills:
        # Calculate the total for each unpaid bill and add it to the sum
        total = OrderItem.objects.filter(order__bill=bill).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total'] or 0
        unpaid_revenue += total

    data = {
        'todays_orders': todays_orders_count,
        'pending_orders': pending_orders_count,
        'total_dishes': total_dishes_count,
        'paid_revenue_today': float(paid_revenue_today),
        'unpaid_revenue': float(unpaid_revenue),
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def daily_sales_chart(request):
    """
    Provides sales data for the last 7 days for a chart.
    """
    today = timezone.now().date()
    seven_days_ago = today - timedelta(days=6)

    # Get all served order items within the last 7 days
    sales_data = OrderItem.objects.filter(
        order__created_at__date__gte=seven_days_ago,
    ).annotate(
        # Extract the date part from the created_at datetime field
        date=models.functions.TruncDate('order__created_at')
    ).values('date').annotate(
        # For each date, calculate the total revenue
        daily_revenue=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
    ).order_by('date')

    # Create a dictionary of all dates in the last 7 days initialized to zero revenue
    date_range = [seven_days_ago + timedelta(days=i) for i in range(7)]
    sales_map = {date.strftime('%Y-%m-%d'): 0 for date in date_range}

    # Populate the map with the actual sales data
    for entry in sales_data:
        sales_map[entry['date'].strftime('%Y-%m-%d')] = float(entry['daily_revenue'])

    # Convert the map to the list format the chart expects
    chart_data = [{'date': date, 'revenue': revenue} for date, revenue in sales_map.items()]

    return Response(chart_data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def recent_orders(request):
    """
    Returns all of today's orders, sorted by status (active first), then by time.
    """
    today = timezone.now().date()

    # ... (your status_order logic remains the same)
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
    """
    active_statuses = ['Pending', 'Preparing', 'Ready']
    
    orders = Order.objects.filter(status__in=active_statuses).order_by('created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """
    Allows staff to update the status of an order and handles billing logic.
    This version now prevents updating orders from previous days.
    """
    try:
        order = Order.objects.get(id=order_id)
        
        # --- THE FIX IS HERE ---
        # 1. Check if the order is from a previous day.
        if order.created_at.date() < date.today():
            return Response(
                {'error': 'Cannot update an order from a previous day.'}, 
                status=status.HTTP_403_FORBIDDEN # 403 Forbidden is the correct status code
            )

        new_status = request.data.get('status')
        
        valid_statuses = [s[0] for s in ORDER_STATUS]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        
        # 2. Make the status check case-insensitive for robustness
        if new_status and new_status.lower() == 'served':
            try:
                table = Table.objects.get(table_number=order.table_number)
                
                # Find an existing unpaid bill for this table or create a new one.
                active_bill, created = Bill.objects.get_or_create(table=table, is_paid=False)
                
                # Associate this order with the active bill.
                order.bill = active_bill

            except Table.DoesNotExist:
                return Response({'error': f'Table {order.table_number} not found in database.'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'An unexpected error occurred during billing.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        order.save() # This saves the status change and the link to the bill.
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)



class MyTokenObtainPairView(TokenObtainPairView):
    """
    Takes a user's username and password and returns an
    access and refresh JSON web token.
    """
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_orders_list(request):
    """
    Returns a list of all orders, with optional date filtering.
    Accepts 'start_date' and 'end_date' query parameters in YYYY-MM-DD format.
    """
    # Start with all orders, ordered by most recent first
    queryset = Order.objects.all().order_by('-created_at')

    # Get date parameters from the request URL
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)

    if start_date_str:
        # Filter orders created on or after the start date
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        queryset = queryset.filter(created_at__date__gte=start_date)

    if end_date_str:
        # Filter orders created on or before the end date
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        queryset = queryset.filter(created_at__date__lte=end_date)

    serializer = OrderSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Protect this so only logged-in users can see their order
def get_order_status(request, order_id):
    """
    Fetches a specific order to let the customer track its status.
    """
    try:
        # Ensure the order belongs to the requesting customer for security
        customer = Customer.objects.get(phone_number=request.user.username)
        order = Order.objects.get(id=order_id, customer=customer)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or you do not have permission to view it.'}, status=status.HTTP_404_NOT_FOUND)
    except AttributeError:
        # This handles cases where request.user is not linked to a customer profile
        return Response({'error': 'Invalid user profile.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_order_history(request):
    """
    Returns all of a customer's orders (active and past), sorted by status.
    """
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        status_order = Case(
            When(status='Pending', then=Value(1)),
            When(status='Preparing', then=Value(2)),
            When(status='Ready', then=Value(3)),
            # An unpaid 'Served' order is still active
            When(status='Served', bill__is_paid=False, then=Value(4)),
            # A paid 'Served' order is a past order
            When(status='Served', bill__is_paid=True, then=Value(5)),
            # Any other status (e.g., 'Cancelled') goes to the end
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
