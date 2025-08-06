# inventory/serializers.py

from rest_framework import serializers
from .models import Ingredient

class IngredientSerializer(serializers.ModelSerializer):
    """
    Serializer for the Ingredient model.
    """
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'current_stock', 'unit', 'low_stock_threshold']

