# accounts/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet

# Create a router and register the AccountViewSet with it.
router = DefaultRouter()
router.register(r'', AccountViewSet, basename='account')

# The urlpatterns variable must be a list of URL patterns.
urlpatterns = [
    path('', include(router.urls)),
]
