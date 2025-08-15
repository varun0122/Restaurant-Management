from django.urls import path
from .views import unpaid_bills_list, mark_bill_as_paid
from . import views
urlpatterns = [
    path('unpaid/', views.unpaid_bills_list, name='unpaid-bills'),
    path('<int:bill_id>/mark-as-paid/', views.mark_bill_as_paid, name='mark-as-paid'),
    path('<int:bill_id>/apply-discount/', views.apply_discount, name='apply-discount'),
    path('recent/', views.recent_bills_list, name='recent-bills'),
    # Customer URLs
    path('myunpaid/', views.customer_unpaid_bills, name='customer-unpaid-bills'),
    path('customer/<int:bill_id>/', views.get_bill_details, name='customer-bill-details'),
    
    # --- NEW: Customer Discount URLs ---
    path('customer/<int:bill_id>/apply-discount/', views.customer_apply_discount, name='customer-apply-discount'),
    #path('customer/<int:bill_id>/request-special-discount/', views.customer_request_special_discount, name='customer-request-special-discount'),
    path('customer/<int:bill_id>/remove-discount/', views.customer_remove_discount, name='customer-remove-discount'),
]