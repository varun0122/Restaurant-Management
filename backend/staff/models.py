from django.db import models

STAFF_ROLES = [
    ('kitchen', 'Kitchen'),
    ('waitstaff', 'Waitstaff'),
    ('admin', 'Admin'),
]

class Staff(models.Model):
    username = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    role = models.CharField(max_length=50, choices=STAFF_ROLES)  # 'admin' is part of choices now

    def __str__(self):
        return f"{self.username} ({self.role})"
