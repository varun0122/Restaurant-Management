from django.urls import path, include
from rest_framework_nested import routers
from . import views

router = routers.DefaultRouter()

# --- Group all main router registrations together ---
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'dishes', views.DishViewSet, basename='dish')
router.register(r'pos-dishes', views.POSDishViewSet, basename='pos-dish')
router.register(r'pos-categories', views.POSCategoryViewSet, basename='pos-category')

# --- Create nested router after main registrations are done ---
dishes_router = routers.NestedDefaultRouter(router, r'dishes', lookup='dish')
dishes_router.register(r'ingredients', views.DishIngredientViewSet, basename='dish-ingredients')
router.register(r'manage-categories', views.ManageCategoryViewSet, basename='manage-category')
router.register(r'manage-dishes', views.ManageDishViewSet, basename='manage-dish')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(dishes_router.urls)),
]