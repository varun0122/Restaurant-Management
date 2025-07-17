from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Staff
from .serializers import StaffLoginSerializer, StaffSerializer
from orders.models import Order
from orders.serializers import OrderSerializer
from django.db.models import Count

@api_view(['POST'])
def staff_login(request):
    serializer = StaffLoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        phone = serializer.validated_data['phone']

        staff, created = Staff.objects.get_or_create(username=username, phone=phone)
        
        # You may handle is_logged_in here if needed
        staff.save()

        return Response({
            'id': staff.id,
            'username': staff.username,
            'phone': staff.phone,
            'role': staff.role,
            'is_admin': staff.role == 'admin'  # Optional, can drop this if using role directly
        })

    return Response(serializer.errors, status=400)


@api_view(['GET'])
def staff_orders(request, role):
    if role == 'kitchen':
        orders = Order.objects.filter(status__in=['Pending', 'Preparing']).order_by('created_at')
    elif role == 'waitstaff':
        orders = Order.objects.filter(status__in=['Ready']).order_by('-created_at')
    else:
        return Response({'error': 'Invalid role'}, status=400)
    
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def admin_summary(request):
    summary = Order.objects.values('status').annotate(count=Count('id'))
    return Response(summary)
