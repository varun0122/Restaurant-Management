from rest_framework import serializers
from django.db.models import Sum, F, DecimalField
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Import your models
from menu.models import Dish
from customers.models import Customer
from .models import Order, OrderItem
from billing.models import Bill # It's safe to import models

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
        # This is the fix for the repeat order bug
        fields = ['id', 'name', 'price', 'food_type', 'image_url']

class OrderItemSerializer(serializers.ModelSerializer):
    dish = DishForOrderItemSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id', 'dish', 'quantity']

# --- FIX: We define the MinimalBillSerializer here to break the circular import ---
class MinimalBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = ['id', 'is_paid']

# ====================================================================
#  Main OrderSerializer
# ====================================================================
class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    bill = MinimalBillSerializer(read_only=True, allow_null=True)
    
    # --- FIX #1: The field for payment status string ---
    payment_status = serializers.SerializerMethodField()
    
    # --- FIX #2: The field for the total amount that was missing ---
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        # Ensure both new fields are included here
        fields = [
            'id', 
            'customer', 
            'status', 
            'created_at', 
            'items', 
            'table_number', 
            'bill',
            'payment_status',  # <-- Added
            'total_amount'     # <-- Added
        ]

    def get_payment_status(self, obj):
        """
        Returns "Paid" or "Unpaid" based on the related bill's status.
        """
        # 'obj' is the Order instance.
        if obj.bill and obj.bill.is_paid:
            return "Paid"
        return "Unpaid"

    def get_total_amount(self, obj):
        """
        Calculates the total amount for the order by summing its item prices.
        """
        # This robustly calculates the sum of (quantity * price) for all items.
        total = obj.items.aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        # Return the calculated total, or 0.00 if there are no items.
        return total or 0.00

# ====================================================================
#  Write-Only Serializer
# ====================================================================
class OrderWriteSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField()
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    table_number = serializers.IntegerField()

    class Meta:
        model = Order
        fields = ['customer_id', 'items', 'table_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                dish_id=item_data['dish_id'],
                quantity=item_data['quantity']
            )
        return order

# ====================================================================
#  Dashboard Serializer
# ====================================================================
class RecentOrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    # --- FIX #1: Add the payment status field ---
    payment_status = serializers.SerializerMethodField()

    # --- FIX #2: Add the total amount field ---
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        # Add the two new fields to this list
        fields = [
            'id', 
            'customer', 
            'table_number', 
            'total_amount', # <-- Add this
            'status', 
            'payment_status', # <-- Add this
            'created_at', 
            'items'
        ]

    def get_payment_status(self, obj):
        """
        Returns "Paid" or "Unpaid" based on the related bill.
        """
        if hasattr(obj, 'bill') and obj.bill and obj.bill.is_paid:
            return "Paid"
        return "Unpaid"

    def get_total_amount(self, obj):
        """
        Calculates the total amount for this specific order.
        """
        total = obj.items.aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        return total or 0.00
    
class OrderSerializerForBilling(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['items'] 