from django.contrib import admin
from .models import Bill

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('id', 'table', 'final_amount', 'is_paid', 'created_at')
    list_filter = ('is_paid', 'created_at')
    
    # This is the crucial part:
    # It makes 'final_amount' visible but not editable in the admin form.
    readonly_fields = ('final_amount', 'created_at', 'paid_at')

    # You can add other fields to search_fields or fieldsets as needed
    search_fields = ('table__table_number',)