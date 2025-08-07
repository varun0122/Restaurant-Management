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

    class Meta:
        model = Bill
        fields = [
            'id', 'table_number', 'is_paid', 'created_at', 'orders',
            'total_amount', 'applied_discount', 'discount_amount',
            'discount_request_pending'
        ]

    def get_total_amount(self, obj):
        total = OrderItem.objects.filter(order__bill=obj).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        return "{:.2f}".format(total or Decimal('0.00'))  # 🔁 FIX: Convert to float

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # ✅ Convert Decimal discount_amount to float
        discount = data.get('discount_amount')
        if discount is not None and isinstance(discount, Decimal):
            data['discount_amount'] = float(discount)

        return data
