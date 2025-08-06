# menu/serializers.py
from rest_framework import serializers
from .models import Category, Dish,DishIngredient
from inventory.models import Ingredient
class CategorySerializer(serializers.ModelSerializer):
    # ... no changes here
    class Meta:
        model = Category
        fields = ['id', 'name']



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
    ingredients = DishIngredientSerializer(source='dishingredient_set', many=True, read_only=True)
    class Meta:
        model = Dish
        # --- Add 'food_type' to this list ---
        fields = ['id', 'name', 'description', 'price', 'image_url', 'is_special', 'likes','category', 'food_type','is_available', 'ingredients']


class DishWriteSerializer(serializers.ModelSerializer):
    # This field will handle the image file upload.
    # It's not required, so you can create/update a dish without changing the image.
    image = serializers.ImageField(required=False, use_url=True)

    class Meta:
        model = Dish
        # We include all fields that should be editable by the admin.
        fields = ['name', 'description', 'price', 'is_special', 'food_type', 'category', 'image']
