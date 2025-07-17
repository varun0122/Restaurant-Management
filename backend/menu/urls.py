from django.urls import path
from . import views

urlpatterns = [
    path('', views.menu_list),
    path('specials/', views.todays_special),
    path('most-liked/', views.most_liked_list),
]
