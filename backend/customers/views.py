from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .models import Customer
import random

@api_view(['POST'])
def send_otp(request):
    phone = request.data.get('phone_number')
    if not phone:
        return Response({'error': 'Phone number required'}, status=400)

    otp = str(random.randint(1000, 9999))
    customer, created = Customer.objects.get_or_create(phone_number=phone)
    customer.otp = otp
    customer.save()

    print(f"OTP for {phone} is {otp}")  # Print OTP for testing
    return Response({'message': 'OTP sent successfully'})

@api_view(['POST'])
def verify_otp(request):
    phone = request.data.get('phone_number')
    otp = request.data.get('otp')
    table = request.data.get('table_number')

    try:
        customer = Customer.objects.get(phone_number=phone)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=404)

    if str(customer.otp) == str(otp):
        customer.table_number = table
        customer.save()
        return Response({
            'id': customer.id,
            'phone_number': customer.phone_number,
            'table_number': customer.table_number
        })
    else:
        return Response({'error': 'Invalid OTP'}, status=400)
