from django.db import models

class Customer(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    table_number = models.PositiveIntegerField(null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.phone_number} (Table {self.table_number})"
