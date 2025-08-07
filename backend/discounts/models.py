# discounts/models.py

from django.db import models

class Discount(models.Model):
    """
    Represents a discount coupon or offer that can be applied to a bill.
    """
    DISCOUNT_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]

    code = models.CharField(max_length=20, unique=True, help_text="The code customers or staff will enter (e.g., STUDENT15, DIWALI20).")
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2, help_text="The percentage (e.g., 15 for 15%) or the fixed amount (e.g., 50 for ₹50).")
    is_active = models.BooleanField(default=True, help_text="Only active discounts can be applied.")
    
    # This flag is for special offers like student discounts
    requires_staff_approval = models.BooleanField(default=False, help_text="If checked, this discount must be approved by a staff member.")

    def __str__(self):
        if self.discount_type == 'PERCENTAGE':
            return f"{self.code} ({self.value}% off)"
        return f"{self.code} (₹{self.value} off)"

