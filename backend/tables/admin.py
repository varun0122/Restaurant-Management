from django.contrib import admin
from .models import Table

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    # These are the corrected field names
    list_display = ('table_number', 'qr_code')