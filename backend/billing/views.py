# billing/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.views import APIView
from django.utils import timezone
from customers.models import Customer
from .models import Bill
from discounts.models import Discount
from .serializers import BillSerializer
from decimal import Decimal,InvalidOperation,ROUND_HALF_UP
from customers.serializers import CustomerSerializer
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.db import transaction
from channels.layers import get_channel_layer
from orders.serializers import DashboardOrderSerializer 
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)





# billing/views.py
# billing/views.py
def broadcast_bill_and_order_updates(message, bill):
    """
    Broadcasts updates to both the billing channel and the order/dashboard channel.
    """
    channel_layer = get_channel_layer()
    
    # 1. Broadcast to the general billing page
    async_to_sync(channel_layer.group_send)(
        'unpaid_bills',
        {'type': 'bill_update', 'message': message}
    )
    
    # 2. Broadcast an order_update message for each affected order to update the dashboard
    for order in bill.orders.all():
        serialized_order = DashboardOrderSerializer(order).data
        order_message = {'type': 'order_update', 'order': serialized_order}
        
        async_to_sync(channel_layer.group_send)('kitchen_orders', order_message)
        
        if order.customer:
            async_to_sync(channel_layer.group_send)(f'customer_{order.customer.id}', order_message)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def unpaid_bills_list(request):
    unpaid_bills = Bill.objects.filter(is_paid=False).order_by('created_at')
    serializer = BillSerializer(unpaid_bills, many=True)
    return Response(serializer.data)

def update_bill_amounts(bill):
    subtotal = Decimal('0.00')
    for order in bill.orders.all():
        for item in order.items.all():
            subtotal += item.dish.price * item.quantity
    tax = subtotal * Decimal('0.05')
    bill.subtotal = subtotal
    bill.tax_amount = tax
    bill.recalculate_and_save()

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def mark_bill_as_paid(request, bill_id):
    logger.info(f"\n--- Processing Bill #{bill_id} ---")
    
    # ✨ FIX 1: Wrap the entire operation in a transaction
    try:
        with transaction.atomic():
            try:
                bill = Bill.objects.select_for_update().get(id=bill_id, is_paid=False)
            except Bill.DoesNotExist:
                logger.warning(f"FAILED: Bill #{bill_id} not found or already paid.")
                return Response({'error': 'Bill not found or already paid.'}, status=status.HTTP_404_NOT_FOUND)

            # Recalculate totals to ensure they are final
            bill.recalculate_and_save()

            # Find the associated customer
            customer = bill.orders.first().customer if bill.orders.exists() else None

            if not customer:
                logger.warning("No customer linked to bill's orders. Cannot award coins.")
                bill.is_paid = True
                bill.paid_at = timezone.now()
                bill.save(update_fields=['is_paid', 'paid_at'])
                return Response({'message': 'Bill marked as paid, but no customer was found.'})

            logger.info(f"Customer found -> {customer.phone_number}")
            logger.info(f"Final amount to check -> {bill.final_amount}")

            if customer and bill.final_amount <= 0:
                logger.info("Final amount is zero, so no coins will be awarded.")
                bill.is_paid = True
                bill.paid_at = timezone.now()
                bill.save(update_fields=['is_paid', 'paid_at'])
                return Response({'message': f'Bill #{bill.id} paid, but amount was zero. No coins awarded.'})

            coins_earned = int(bill.final_amount / 10)
            logger.info(f"Coins to award -> {coins_earned}")

            # ✨ FIX 2: Use F() expression to prevent race conditions
            customer.loyalty_coins = F('loyalty_coins') + coins_earned
            customer.save(update_fields=['loyalty_coins'])

            # Mark the bill as paid
            bill.is_paid = True
            bill.paid_at = timezone.now()
            bill.save(update_fields=['is_paid', 'paid_at'])
            
            # Refresh customer from DB to get the updated coin value for the response
            customer.refresh_from_db()
            logger.info(f"SUCCESS. Awarded {coins_earned} coins. New balance: {customer.loyalty_coins}")
            broadcast_bill_and_order_updates(f"Bill #{bill.id} was paid.",bill) 
            return Response({
                'message': f'Bill #{bill.id} marked as paid. Customer earned {coins_earned} coins.',
                'customer': CustomerSerializer(customer).data
            }, status=status.HTTP_200_OK)

    except Exception as e:
        # If anything inside the transaction fails, it will be rolled back.
        logger.error(f"CRITICAL ERROR processing bill #{bill_id}: {str(e)}")
        return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def apply_discount(request, bill_id):
    try:
        bill = Bill.objects.get(id=bill_id, is_paid=False)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found or already paid.'}, status=status.HTTP_404_NOT_FOUND)

    code = request.data.get('code')
    if not code:
        return Response({'error': 'Discount code is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        discount = Discount.objects.get(code__iexact=code, is_active=True)
    except Discount.DoesNotExist:
        return Response({'error': 'Invalid or inactive discount code.'}, status=status.HTTP_400_BAD_REQUEST)

    # --- FIX STARTS HERE ---

    # 1. Get a fresh, reliable subtotal directly from the model
    # (Assuming you have a method on your Bill model to calculate totals)
    bill.recalculate_and_save() 
    subtotal = bill.subtotal

    # 2. Add the missing validation check
    if subtotal < discount.minimum_bill_amount:
        return Response({
            'error': f"Bill subtotal must be at least ₹{discount.minimum_bill_amount} to use this discount."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # --- END OF FIX ---

    # Now, calculate the discount using the reliable subtotal
    if discount.discount_type == 'PERCENTAGE':
        discount_amount = (subtotal * discount.value) / Decimal('100')
    else:
        discount_amount = discount.value

    # Apply the discount
    bill.applied_discount = discount
    bill.discount_amount = min(subtotal, discount_amount)
    
    # Recalculate final totals and save
    bill.recalculate_and_save()

    # Broadcast the real-time update
    broadcast_bill_and_order_updates(f"Discount '{discount.code}' applied to bill #{bill.id}.",bill)

    return Response(BillSerializer(bill).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bill_details(request, bill_id):
    try:
        bill = Bill.objects.get(id=bill_id)
        customer = Customer.objects.get(phone_number=request.user.username)
        
        if not bill.orders.filter(customer=customer).exists():
            raise Bill.DoesNotExist

        serializer = BillSerializer(bill)
        return Response(serializer.data)
        
    except (Bill.DoesNotExist, Customer.DoesNotExist):
        return Response({'error': 'Bill not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_unpaid_bills(request):
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        
        unpaid_bills = Bill.objects.filter(
            orders__customer=customer, 
            is_paid=False
        ).distinct().order_by('-created_at')
        
        serializer = BillSerializer(unpaid_bills, many=True)
        return Response(serializer.data)
        
    except Customer.DoesNotExist:
        return Response({'error': 'Customer profile not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def customer_apply_discount(request, bill_id):
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        
        # --- FIX: First, get the bill by its unique ID. ---
        bill = Bill.objects.get(id=bill_id, is_paid=False)

        # --- FIX: Then, perform a separate security check. ---
        if not bill.orders.filter(customer=customer).exists():
            # If the bill doesn't belong to the customer, treat it as not found.
            raise Bill.DoesNotExist

        code = request.data.get('code')

        if not code:
            return Response({'error': 'Discount code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        discount = Discount.objects.get(code__iexact=code, is_active=True)

        if discount.requires_staff_approval:
            bill.discount_request_pending = True
            bill.recalculate_and_save()
            return Response({'message': 'Discount requested. A staff member will verify it at your table.'})
        else:
            total_amount = Decimal(BillSerializer(bill).data.get('total_amount', 0))
            if discount.discount_type == 'PERCENTAGE':
                discount_amount = (total_amount * discount.value) / 100
            else:
                discount_amount = discount.value
            discount_amount = min(total_amount, discount_amount)

            bill.applied_discount = discount
            bill.discount_amount = discount_amount
            bill.recalculate_and_save()
            broadcast_bill_and_order_updates(f"Discount update for bill #{bill.id}.",bill)
            return Response(BillSerializer(bill).data)

    except (Bill.DoesNotExist, Customer.DoesNotExist):
        return Response({'error': 'Bill not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)
    except Discount.DoesNotExist:
        return Response({'error': 'Invalid or inactive discount code.'}, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def customer_remove_discount(request, bill_id):
    try:
        customer = Customer.objects.get(phone_number=request.user.username)
        
        # --- FIX: Use the safer, two-step query to prevent the error ---
        bill = Bill.objects.get(id=bill_id, is_paid=False)
        if not bill.orders.filter(customer=customer).exists():
            raise Bill.DoesNotExist

        # Reset all discount-related fields
        bill.applied_discount = None
        bill.discount_amount = Decimal('0.00')
        bill.discount_request_pending = False
        bill.recalculate_and_save()
        broadcast_bill_and_order_updates(f"Discount removed from bill #{bill.id}.",bill)
        return Response(BillSerializer(bill).data)

    except (Bill.DoesNotExist, Customer.DoesNotExist):
        return Response({'error': 'Bill not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def recent_bills_list(request):
    """
    Returns a list of all bills created on the current day.
    """
    today = timezone.now().date()
    todays_bills = Bill.objects.filter(created_at__date=today).order_by('-created_at')
    serializer = BillSerializer(todays_bills, many=True)
    return Response(serializer.data)


class ApplyCoinsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, bill_id):
        user = request.user
        try:
            customer = Customer.objects.get(phone_number=user.username)
        except Customer.DoesNotExist:
            return Response({"error": "Customer profile not found for the logged-in user."}, status=404)

        bill = get_object_or_404(Bill, id=bill_id, is_paid=False)

        owner_pks = set(bill.orders.values_list('customer__pk', flat=True))
        if customer.pk not in owner_pks:
            return Response({"error": "You are not authorized to update this bill."}, status=403)

        try:
            coins_to_apply = int(request.data.get("coins", 0))
        except (TypeError, ValueError):
            return Response({"error": "Invalid coins value"}, status=400)

        if coins_to_apply <= 0:
            return Response({"error": "Coins must be greater than 0"}, status=400)

        if coins_to_apply > customer.loyalty_coins:
            return Response({"error": "Not enough coins available"}, status=400)

        # 🔥 Convert coins → rupee value
        COIN_VALUE = Decimal('0.10')  # adjust as needed
        bill.coin_discount = Decimal(coins_to_apply) * COIN_VALUE
        bill.coins_redeemed = coins_to_apply   # <-- Add this line to save number of coins redeemed

        bill.recalculate_and_save() 

        # Deduct used coins from customer balance
        customer.loyalty_coins -= coins_to_apply
        customer.save()
        broadcast_bill_and_order_updates(f"Coins applied to bill #{bill.id}.",bill) 
        return Response({
            "message": f"{coins_to_apply} coins applied successfully",
            "coins_value": str(bill.coin_discount),
            "new_bill_details": BillSerializer(bill).data,
            "remaining_coins": customer.loyalty_coins,
        }, status=200)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_coins(request, bill_id):
    user = request.user
    customer = get_object_or_404(Customer, phone_number=user.username)
    bill = get_object_or_404(Bill, id=bill_id, is_paid=False)
    
    if customer.pk not in bill.orders.values_list('customer__pk', flat=True):
        return Response({"error": "Not authorized to update this bill."}, status=403)
    
    coins_redeemed = bill.coins_redeemed or 0
    
    if coins_redeemed == 0:
        return Response({"error": "No coins applied to remove."}, status=400)
    
    # Remove coin discount and coins redeemed
    bill.coin_discount = Decimal('0.00')
    bill.coins_redeemed = 0
    bill.recalculate_and_save()


    # Refund coins to customer
    customer.loyalty_coins += coins_redeemed
    customer.save()
    broadcast_bill_and_order_updates(f"Coins removed from bill #{bill.id}.",bill)
    return Response({
        "message": f"Removed {coins_redeemed} coins from the bill.",
        "remaining_coins": customer.loyalty_coins,
        "bill": BillSerializer(bill).data,
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_remove_discount(request, bill_id):
    try:
        bill = Bill.objects.get(id=bill_id, is_paid=False)
        bill.applied_discount = None
        bill.discount_amount = Decimal('0.00')
        bill.discount_request_pending = False
        bill.recalculate_and_save()
        broadcast_bill_and_order_updates(f"Admin removed discount from bill #{bill.id}.",bill)
        return Response(BillSerializer(bill).data)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found or already paid.'}, status=404)
    
@api_view(['POST'])
@permission_classes([IsAdminUser])
def preview_discount(request):
    """
    Validates and calculates discount amount for a given code on a cart.
    This does NOT create or modify any bills/orders.
    """
    data = request.data
    code = data.get('code', '').strip()
    subtotal = data.get('subtotal')

    if not code:
        return Response({'valid': False, 'error': 'Discount code is required.'}, status=400)

    try:
        subtotal = Decimal(str(subtotal))
    except (InvalidOperation, TypeError):
        return Response({'valid': False, 'error': 'Invalid subtotal value.'}, status=400)

    try:
        discount = Discount.objects.get(code__iexact=code, is_active=True)
    except Discount.DoesNotExist:
        return Response({'valid': False, 'error': 'Invalid or inactive discount code.'}, status=400)

    # --- ADD THIS VALIDATION ---
    if subtotal < discount.minimum_bill_amount:
        return Response({
            'valid': False, 
            'error': f"Cart total must be at least ₹{discount.minimum_bill_amount} to use this discount."
        }, status=400)
    # --- END OF VALIDATION ---

    if discount.discount_type == 'PERCENTAGE':
        discount_amount = (subtotal * discount.value) / Decimal('100')
    else:
        discount_amount = discount.value

    discount_amount = min(subtotal, discount_amount)

    discount_metadata = {
        'code': discount.code,
        'discount_type': discount.discount_type,
        'value': str(discount.value),
        'minimum_bill_amount': str(discount.minimum_bill_amount)
    }

    return Response({
        'valid': True,
        'discount_amount': float(discount_amount),
        'discount_metadata': discount_metadata,
        'subtotal_after_discount': float(subtotal - discount_amount),
    })