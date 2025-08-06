from rest_framework import serializers
from django.db.models import Sum, F, DecimalField
from .models import Bill
from orders.models import OrderItem

# --- FIX: We now safely import OrderSerializer from the orders app ---
from orders.serializers import OrderSerializer
from orders.serializers import OrderSerializerForBilling

class BillSerializer(serializers.ModelSerializer):
    """
    Serializes a Bill for the customer-facing BillPage.
    It includes all nested items and their prices.
    """
    # This uses the lightweight serializer which correctly nests item and dish details.
    orders = OrderSerializerForBilling(many=True, read_only=True)
    
    total_amount = serializers.SerializerMethodField()
    table_number = serializers.CharField(source='table.table_number', read_only=True)

    class Meta:
        model = Bill
        fields = ['id', 'table_number', 'is_paid', 'created_at', 'orders', 'total_amount']

    def get_total_amount(self, obj):
        """
        This is the most efficient way to calculate the total for a single bill.
        This will be the 'subtotal' on the frontend.
        """
        total = OrderItem.objects.filter(order__bill=obj).aggregate(
            total=Sum(F('quantity') * F('dish__price'), output_field=DecimalField())
        )['total']
        return total or 0.00