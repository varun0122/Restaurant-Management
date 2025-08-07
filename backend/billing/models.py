# billing/models.py

from django.db import models
from tables.models import Table
from discounts.models import Discount # Import the new Discount model

class Bill(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    # --- FIX: Removed the redundant ManyToManyField to resolve the clash ---
    # The relationship is already defined by the ForeignKey in the Order model.
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # --- NEW FIELDS FOR DISCOUNTS ---
    applied_discount = models.ForeignKey(
        Discount, 
        on_delete=models.SET_NULL, # If a discount is deleted, don't delete the bill
        null=True, 
        blank=True
    )
    discount_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00
    )
    
    # --- NEW FIELD FOR STAFF-APPROVED DISCOUNTS ---
    discount_request_pending = models.BooleanField(default=False)

    def __str__(self):
        # Using the more descriptive string representation from your old code
        return f"Bill for {self.table} - {'Paid' if self.is_paid else 'Unpaid'}"

