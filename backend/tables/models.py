import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models

def generate_qr(table):
    data = f"https://192.168.110.1:5173/login?table={table.number}"
    qr_img = qrcode.make(data)
    buffer = BytesIO()
    qr_img.save(buffer)
    filename = f'table-{table.number}-qr.png'
    return File(buffer, name=filename)

class Table(models.Model):
    number = models.PositiveIntegerField(unique=True)
    qr_image = models.ImageField(upload_to='qrcodes/', blank=True)

    def save(self, *args, **kwargs):
        if not self.qr_image:
            self.qr_image = generate_qr(self)
        super().save(*args, **kwargs)
