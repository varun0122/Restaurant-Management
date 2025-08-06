# orders/serializers.py

from rest_framework import serializers
from django.db.models import Sum, F, DecimalField
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Import your models
from menu.models import Dish
from customers.models import Customer
from .models import Order, OrderItem
from billing.models import Bill

# Import the correct CustomerSerializer from the customers app
from customers.serializers import CustomerSerializer

# ====================================================================
#  Token Serializer
# ====================================================================
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token

# ====================================================================
#  Nested "Read-Only" Serializers
# ====================================================================
class DishForOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = ['id', 'name', 'price', 'food_type', 'image_url']

class OrderItemSerializer(serializers.ModelSerializer):
    dish = DishForOrderItemSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id', 'dish', 'quantity']

class MinimalBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = ['id', 'is_paid']

# ====================================================================
#  Main OrderSerializer (For Reading Data)
# ====================================================================
class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    bill = MinimalBillSerializer(read_only=True, allow_null=True)
    payment_status = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 
            'customer', 
            'status', 
            'created_at', 
            'items', 
            'table_number', 
            'bill',
            'payment_status',
            'total_amount'
        ]

    def get_payment_status(self, obj):
        if obj.bill and obj.bill.is_paid:
            return "Paid"
        return "Unpaid"

    def get_total_amount(self, obj):
        total = obj.items.aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        return total or 0.00

# ====================================================================
#  Write-Only Serializer (For POS and Customer Orders)
# ====================================================================
class OrderItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['dish', 'quantity']

class OrderWriteSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True)
    
    # This field is now optional to support staff-placed orders
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Order
        fields = ['customer', 'table_number', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # The view will handle assigning a "Walk-in" customer if needed
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            
        return order

# ====================================================================
#  Other Specific-Purpose Serializers
# ====================================================================
class RecentOrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 
            'customer', 
            'table_number', 
            'total_amount',
            'status', 
            'payment_status',
            'created_at', 
            'items'
        ]

    def get_payment_status(self, obj):
        if hasattr(obj, 'bill') and obj.bill and obj.bill.is_paid:
            return "Paid"
        return "Unpaid"

    def get_total_amount(self, obj):
        total = obj.items.aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        return total or 0.00
    
class OrderSerializerForBilling(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['items']
