from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.staff_login),
    path('orders/<str:role>/', views.staff_orders),
    path('summary/', views.admin_summary),
]
