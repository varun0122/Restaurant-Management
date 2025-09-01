from django.db import models

class Customer(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    #table_number = models.PositiveIntegerField(null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)
    loyalty_coins = models.PositiveIntegerField(default=0)

    def __str__(self):
        # FIX: Removed the reference to the non-existent 'table_number'
        return self.phone_number