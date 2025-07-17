from django.db import models
from customers.models import Customer
from menu.models import Dish

ORDER_STATUS = [
    ('Pending', 'Pending'),
    ('Preparing', 'Preparing'),
    ('Ready', 'Ready'),
    ('Served', 'Served'),
]

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='Pending')

    def __str__(self):
        return f"Order #{self.id} (Table {self.customer.table_number})"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.dish.name} x{self.quantity}"
