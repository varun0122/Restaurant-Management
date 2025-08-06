from django.urls import path
from .views import unpaid_bills_list, mark_bill_as_paid
from . import views
urlpatterns = [
    path('unpaid/', unpaid_bills_list, name='unpaid-bills-list'),
    path('<int:bill_id>/mark-as-paid/', mark_bill_as_paid, name='mark-bill-as-paid'),
     path('<int:bill_id>/', views.get_bill_details, name='get-bill-details'),
     path('my-unpaid/', views.customer_unpaid_bills, name='customer-unpaid-bills'),
]