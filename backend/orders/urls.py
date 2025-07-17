from django.urls import path
from . import views

urlpatterns = [
    path('place/', views.place_order),
    path('history/<str:phone_number>/', views.order_history),
    path('repeat/<int:order_id>/', views.repeat_order),
    path('kitchen/', views.kitchen_orders),
]
