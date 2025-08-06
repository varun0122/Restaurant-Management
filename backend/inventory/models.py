# inventory/models.py

from django.db import models

class Ingredient(models.Model):
    """
    Represents a single ingredient in the inventory.
    e.g., Flour, Sugar, Chicken Breast, etc.
    """
    UNIT_CHOICES = [
        ('g', 'Grams'),
        ('kg', 'Kilograms'),
        ('ml', 'Milliliters'),
        ('l', 'Liters'),
        ('pcs', 'Pieces'),
    ]

    name = models.CharField(max_length=100, unique=True)
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    unit = models.CharField(max_length=3, choices=UNIT_CHOICES)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"

