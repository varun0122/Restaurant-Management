# discounts/serializers.py

from rest_framework import serializers
from .models import Discount

class DiscountSerializer(serializers.ModelSerializer):
    """
    Serializer for the Discount model.
    """
    class Meta:
        model = Discount
        fields = [
            'id', 
            'code', 
            'discount_type', 
            'value', 
            'is_active', 
            'requires_staff_approval'
        ]

