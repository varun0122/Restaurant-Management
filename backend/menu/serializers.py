# menu/serializers.py
from rest_framework import serializers
from .models import Category, Dish

class CategorySerializer(serializers.ModelSerializer):
    # ... no changes here
    class Meta:
        model = Category
        fields = ['id', 'name']

class DishSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    category = CategorySerializer(read_only=True)
    likes = serializers.ReadOnlyField() 
    class Meta:
        model = Dish
        # --- Add 'food_type' to this list ---
        fields = ['id', 'name', 'description', 'price', 'image_url', 'is_special', 'likes','category', 'food_type']