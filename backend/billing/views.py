from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from customers.models import Customer
from .models import Bill
from .serializers import BillSerializer
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAdminUser])
def unpaid_bills_list(request):
    """
    Returns a list of all currently unpaid bills.
    """
    unpaid_bills = Bill.objects.filter(is_paid=False).order_by('created_at')
    serializer = BillSerializer(unpaid_bills, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def mark_bill_as_paid(request, bill_id):
    """
    Marks a specific bill as paid.
    """
    try:
        bill = Bill.objects.get(id=bill_id)
        bill.is_paid = True
        bill.paid_at = timezone.now()
        bill.save()
        return Response({'message': 'Bill marked as paid successfully.'}, status=status.HTTP_200_OK)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bill_details(request, bill_id):
    """
    Fetches the details for a specific bill, ensuring it belongs to the
    requesting customer.
    """
    try:
        # --- THE FIX IS HERE ---
        # 1. First, find the bill by its unique ID.
        bill = Bill.objects.get(id=bill_id)
        
        # 2. Then, find the customer profile for the logged-in user.
        customer = Customer.objects.get(phone_number=request.user.username)
        
        # 3. Finally, check if this bill actually belongs to the customer.
        # We do this by checking if any of the orders on the bill belong to them.
        if not bill.orders.filter(customer=customer).exists():
            # If not, raise an error as if the bill was not found.
            raise Bill.DoesNotExist

        serializer = BillSerializer(bill)
        return Response(serializer.data)
        
    except (Bill.DoesNotExist, Customer.DoesNotExist):
        return Response({'error': 'Bill not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_unpaid_bills(request):
    """
    Returns a list of all unpaid bills for the logged-in customer.
    """
    try:
        # Find the customer profile for the logged-in user
        customer = Customer.objects.get(phone_number=request.user.username)
        
        # Find all unpaid bills that contain at least one order from this customer.
        # .distinct() ensures we don't get the same bill multiple times.
        unpaid_bills = Bill.objects.filter(
            orders__customer=customer, 
            is_paid=False
        ).distinct().order_by('-created_at')
        
        serializer = BillSerializer(unpaid_bills, many=True)
        return Response(serializer.data)
        
    except Customer.DoesNotExist:
        return Response({'error': 'Customer profile not found.'}, status=status.HTTP_404_NOT_FOUND)