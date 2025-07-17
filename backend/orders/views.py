from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Order, OrderItem
from customers.models import Customer
from .serializers import OrderSerializer
from rest_framework import status

@api_view(['POST'])
def place_order(request):
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def order_history(request, phone_number):
    try:
        customer = Customer.objects.get(phone_number=phone_number)
        orders = Order.objects.filter(customer=customer).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=404)

@api_view(['GET'])
def repeat_order(request, order_id):
    try:
        old_order = Order.objects.get(id=order_id)
        new_order = Order.objects.create(customer=old_order.customer)
        for item in old_order.items.all():
            OrderItem.objects.create(order=new_order, dish=item.dish, quantity=item.quantity)
        return Response({"message": "Order repeated", "new_order_id": new_order.id})
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

@api_view(['GET'])
def kitchen_orders(request):
    orders = Order.objects.filter(status__in=['Pending', 'Preparing']).order_by('created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)
