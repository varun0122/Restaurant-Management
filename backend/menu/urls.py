from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'dishes', views.DishViewSet, basename='dish')

# The router now automatically creates all URLs, including the custom actions.
urlpatterns = [
    path('', include(router.urls)),
]
