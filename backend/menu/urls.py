# menu/urls.py

from django.urls import path, include
from rest_framework_nested import routers # Use the nested router
from . import views

# Create the main router
router = routers.DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'dishes', views.DishViewSet, basename='dish')

# Create a nested router for dish ingredients
# This will create URLs like /dishes/{dish_pk}/ingredients/
dishes_router = routers.NestedDefaultRouter(router, r'dishes', lookup='dish')
dishes_router.register(r'ingredients', views.DishIngredientViewSet, basename='dish-ingredients')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(dishes_router.urls)), # Include the nested URLs
]
