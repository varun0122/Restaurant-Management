# orders/utils.py
from menu.models import DishIngredient # <-- Get the Recipe Book from the menu app

def update_inventory_for_order(order, action='deduct'):
    # 1. Look at each dish the customer ordered.
    for item in order.items.all():
        # (e.g., The customer ordered "Spaghetti Carbonara")

        # 2. For that dish, open the Recipe Book to find its specific recipe.
        for recipe_item in DishIngredient.objects.filter(dish=item.dish):

            # 3. Look at one line in the recipe (e.g., "100g of Pasta").
            # recipe_item IS the connection between the dish and the ingredient.
            
            # This gets the actual "Pasta" ingredient from your inventory.
            ingredient = recipe_item.ingredient 
            quantity_needed = recipe_item.quantity_required * item.quantity

            # 4. Finally, go to the Pantry (Inventory) and update the stock of "Pasta".
            if action == 'deduct':
                ingredient.current_stock -= quantity_needed
            elif action == 'restore':
                ingredient.current_stock += quantity_needed
            
            # Save the new stock level in the inventory.
            ingredient.save()