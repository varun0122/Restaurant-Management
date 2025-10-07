from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp),
    path('verify-otp/', views.verify_otp),
    path('me/', views.get_current_customer),
    path('', views.list_customers, name='customer-list'),
    
]
