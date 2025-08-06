# billing/models.py
from django.db import models
from tables.models import Table

class Bill(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Bill for {self.table} - {'Paid' if self.is_paid else 'Unpaid'}"