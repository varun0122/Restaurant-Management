# billing/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from customers.models import Customer
from .models import Bill
from discounts.models import Discount
from .serializers import BillSerializer
from decimal import Decimal,InvalidOperation

@api_view(['GET'])
@permission_classes([IsAdminUser])
def unpaid_bills_list(request):
    unpaid_bills = Bill.objects.filter(is_paid=False).order_by('created_at')
    serializer = BillSerializer(unpaid_bills, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def mark_bill_as_paid(request, bill_id):
    try:
        bill = Bill.objects.get(id=bill_id, is_paid=False)
        bill.is_paid = True
        bill.paid_at = timezone.now()
        bill.save()
        return Response({'message': 'Bill marked as paid successfully.'})
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found or already paid.'}, status=status.HTTP_404_NOT_FOUND)


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

    serialized_bill = BillSerializer(bill).data
    total_amount = serialized_bill.get('total_amount')

    if not total_amount:
        return Response({'error': 'Total amount not available for this bill.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        total_amount = Decimal(str(total_amount))
    except InvalidOperation:
        return Response({'error': 'Invalid total amount value.'}, status=status.HTTP_400_BAD_REQUEST)

    if discount.discount_type == 'PERCENTAGE':
        discount_amount = (total_amount * discount.value) / Decimal('100')
    else:
        discount_amount = discount.value

    discount_amount = min(total_amount, discount_amount)

    bill.applied_discount = discount
    bill.discount_amount = discount_amount
    bill.save()

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
            bill.save()
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
            bill.save()
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
        bill.save()

        return Response(BillSerializer(bill).data)

    except (Bill.DoesNotExist, Customer.DoesNotExist):
        return Response({'error': 'Bill not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)
