from django.db import models
from customers.models import Customer
from menu.models import Dish
from billing.models import Bill

ORDER_STATUS = [
    ('Pending', 'Pending'),
    ('Preparing', 'Preparing'),
    ('Ready', 'Ready'),
    ('Served', 'Served'),
    ('Cancelled', 'Cancelled'),
]

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='Pending')
    table_number = models.PositiveIntegerField()
    is_pos_order = models.BooleanField(
        default=False,
        help_text="True if this order was created from the POS screen."
    )
    bill = models.ForeignKey(
        Bill, 
        on_delete=models.CASCADE,
        related_name='orders', # <-- Add this line
        null=True, 
        blank=True
    )
    def __str__(self):
        # Update the string representation to use the new field
        return f"Order #{self.id} (Table {self.table_number})"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.dish.name} x{self.quantity}"

