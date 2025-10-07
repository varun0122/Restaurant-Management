# menu/models.py
from django.db import models
from inventory.models import Ingredient # Import the Ingredient model

class Category(models.Model):
    name = models.CharField(max_length=100)
    
    # --- ADDED: Description field for the category ---
    description = models.TextField(
        blank=True, 
        null=True, 
        help_text="A brief description of the category (optional)."
    )
    
    is_point_of_sale_only = models.BooleanField(
        default=False, 
        help_text="Items in this category are hidden from the main app and only appear on the staff's POS screen."
    )
    
    def __str__(self):
        return self.name

# --- NEW: Through model for the Dish-Ingredient relationship ---
class DishIngredient(models.Model):
    """
    This model links a Dish to an Ingredient and specifies the
    quantity of that ingredient required for the dish.
    """
    dish = models.ForeignKey('Dish', on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity_required} {self.ingredient.unit} of {self.ingredient.name} for {self.dish.name}"


class Dish(models.Model):
    # --- Preserving your original choices ---
    FOOD_TYPE_CHOICES = [
    ("veg", "Vegetarian"),
    ("non-veg", "Non-Vegetarian"),
        ]
    

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    image = models.ImageField(upload_to='dishes/', null=True, blank=True)
    is_special = models.BooleanField(default=False)
    like_count = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='dishes')
    food_type = models.CharField(max_length=20, choices=FOOD_TYPE_CHOICES)
    is_available = models.BooleanField(default=True) # Added for inventory tracking

    # --- NEW: Relationship to Ingredients ---
    ingredients = models.ManyToManyField(
        Ingredient,
        through=DishIngredient, # Use our custom through model
        related_name='dishes'
    )

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return ""

