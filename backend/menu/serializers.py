from rest_framework import serializers
from .models import Category, Dish

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class DishSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    likes = serializers.ReadOnlyField()  # ✅ Add this only if `@property def likes` exists

    class Meta:
        model = Dish
        fields = ['id', 'name', 'description', 'price', 'image_url', 'likes', 'is_special']