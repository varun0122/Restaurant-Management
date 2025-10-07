# menu/serializers.py
from rest_framework import serializers
from .models import Category, Dish,DishIngredient
from inventory.models import Ingredient
class CategorySerializer(serializers.ModelSerializer):
    # ... no changes here
    class Meta:
        model = Category
        fields = ['id', 'name','description','is_point_of_sale_only']



class SimpleIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'unit']

class DishIngredientSerializer(serializers.ModelSerializer):
    # Use the simple serializer for reading ingredient details
    ingredient = SimpleIngredientSerializer(read_only=True)
    # Use a PrimaryKeyRelatedField for writing (associating an ingredient by its ID)
    ingredient_id = serializers.PrimaryKeyRelatedField(
        queryset=Ingredient.objects.all(), source='ingredient', write_only=True
    )

    class Meta:
        model = DishIngredient
        fields = ['id', 'ingredient', 'ingredient_id', 'quantity_required']
class DishSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    category = CategorySerializer(read_only=True)
    likes = serializers.ReadOnlyField()
    ingredients = DishIngredientSerializer(
        source='dishingredient_set',
        many=True,
        read_only=True
    )

    class Meta:
        model = Dish
        fields = [
            'id', 'name', 'description', 'price', 'image_url',
            'is_special', 'likes', 'category', 'food_type',
            'is_available', 'ingredients'
        ]

    def validate_food_type(self, value):
        label_to_value = {
            "Vegetarian": "veg",
            "Non-Vegetarian": "non-veg",
        }
        return label_to_value.get(value, value) 

# menu/serializers.py

from rest_framework import serializers
from .models import Dish, Category, DishIngredient
import logging

logger = logging.getLogger(__name__)

class DishWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = [
            "id",
            "name",
            "description",
            "price",
            "food_type",
            "category",
            "is_special",
            "is_available",
            "image",
        ]

    def to_internal_value(self, data):
        """
        Log raw request data before validation.
        """
        logger.info("📥 Raw request.data: %s", data)
        return super().to_internal_value(data)

    def validate(self, attrs):
        """
        Log validated data after DRF has parsed and cleaned fields.
        """
        logger.info("✅ Validated data: %s", attrs)
        return attrs

    def create(self, validated_data):
        logger.info("🚀 Creating dish with: %s", validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        logger.info("✏️ Updating dish %s with: %s", instance.id, validated_data)
        return super().update(instance, validated_data)