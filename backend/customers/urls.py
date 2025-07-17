from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp),
    path('verify-otp/', views.verify_otp),
]
