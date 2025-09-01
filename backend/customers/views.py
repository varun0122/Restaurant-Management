from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Customer
from .serializers import CustomerSerializer
import random # Make sure to import random
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
def send_otp(request):
    """
    Gets or creates a customer by phone number, generates a new OTP,
    saves it, and prints it for development.
    """
    phone_number = request.data.get('phone_number')
    if not phone_number:
        return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Use get_or_create to handle both new and existing users
    customer, created = Customer.objects.get_or_create(phone_number=phone_number)
    
    # Generate and save the new OTP
    otp = random.randint(1000, 9999)
    customer.otp = str(otp)
    customer.save(update_fields=['otp'])

    # For development, print the OTP to the terminal where you run the server
    print(f"OTP for {phone_number} is: {otp}")

    return Response({'message': 'OTP sent successfully.'})


@api_view(['POST'])
def verify_otp(request):
    """
    Verifies the OTP for a customer and logs them in.
    """
    phone_number = request.data.get('phone_number')
    otp = request.data.get('otp')

    if not phone_number or not otp:
        return Response({'error': 'Phone number and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Find the customer by their phone number
        customer = Customer.objects.get(phone_number=phone_number)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found. Please send OTP first.'}, status=status.HTTP_404_NOT_FOUND)

    # Check if the provided OTP matches the one stored in the database
    if str(customer.otp) == str(otp):
        # Clear the OTP after successful verification for security
        customer.otp = ''
        customer.save(update_fields=['otp', 'last_login'])
        user, created = User.objects.get_or_create(username=phone_number)
        refresh = RefreshToken.for_user(user)
        # Return the customer's data to the frontend
        serializer = CustomerSerializer(customer)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'customer': serializer.data
        })
    else:
        # If the OTP does not match, return an error
        return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_customer(request):
    user = request.user
    try:
        customer = Customer.objects.get(phone_number=user.username)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)