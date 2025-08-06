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


class DishWriteSerializer(serializers.ModelSerializer):
    # This field will handle the image file upload.
    # It's not required, so you can create/update a dish without changing the image.
    image = serializers.ImageField(required=False, use_url=True)

    class Meta:
        model = Dish
        # We include all fields that should be editable by the admin.
        fields = ['name', 'description', 'price', 'is_special', 'food_type', 'category', 'image']
