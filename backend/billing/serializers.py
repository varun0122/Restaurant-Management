# billing/serializers.py

from rest_framework import serializers
from django.db.models import Sum, F, DecimalField
from .models import Bill
from orders.models import OrderItem
from orders.serializers import OrderSerializerForBilling
from discounts.serializers import DiscountSerializer
from decimal import Decimal

class BillSerializer(serializers.ModelSerializer):
    orders = OrderSerializerForBilling(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    applied_discount = DiscountSerializer(read_only=True)
    bill_status = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id', 'table_number', 'is_paid', 'created_at', 'orders', 'coins_redeemed', 'coin_discount',
            'total_amount', 'applied_discount', 'discount_amount', 
            'discount_request_pending', 'bill_status'
        ]

    def get_total_amount(self, obj):
        total = OrderItem.objects.filter(order__bill=obj).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        # --- FIX: Ensure the output is a standard number format ---
        return "{:.2f}".format(total or Decimal('0.00'))

    def get_bill_status(self, obj):
        order_statuses = [order.status for order in obj.orders.all()]
        if not order_statuses:
            return "No Orders"
        
        if 'Pending' in order_statuses or 'Preparing' in order_statuses:
            return 'Preparing'
        elif all(status == 'Ready' for status in order_statuses):
            return 'Ready'
        elif all(status == 'Served' for status in order_statuses):
            return 'Served'
        else:
            return 'Mixed'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'discount_amount' in data and isinstance(data['discount_amount'], Decimal):
            data['discount_amount'] = float(data['discount_amount'])
        
        if 'coin_discount' in data and isinstance(data['coin_discount'], Decimal):
            data['coin_discount'] = float(data['coin_discount'])
        
        if 'subtotal' in data and isinstance(data['subtotal'], Decimal):
            data['subtotal'] = float(data['subtotal'])
        
        if 'tax_amount' in data and isinstance(data['tax_amount'], Decimal):
            data['tax_amount'] = float(data['tax_amount'])
        
        if 'final_amount' in data and isinstance(data['final_amount'], Decimal):
            data['final_amount'] = float(data['final_amount'])
        
        return data
