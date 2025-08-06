# menu/models.py
from django.db import models

class Category(models.Model):
    # ... no changes here
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class Dish(models.Model):
    # --- Define choices for the new field ---
    FOOD_TYPE_CHOICES = [
        ('veg', 'Vegetarian'),
        ('non-veg', 'Non-Vegetarian'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    image = models.ImageField(upload_to='dishes/', null=True, blank=True)
    is_special = models.BooleanField(default=False)
    like_count = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='dishes')
    
    # --- This is the new field ---
    food_type = models.CharField(max_length=10, choices=FOOD_TYPE_CHOICES, default='veg')

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        # ... no changes here
        if self.image:
            return self.image.url
        return ""