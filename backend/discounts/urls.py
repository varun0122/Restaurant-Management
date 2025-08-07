# discounts/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiscountViewSet, PublicDiscountsViewSet

router = DefaultRouter()
# The '/manage/' endpoint is for admins
router.register(r'manage', DiscountViewSet, basename='discount-manage')
# The '/public/' endpoint is for customers
router.register(r'public', PublicDiscountsViewSet, basename='discount-public')

urlpatterns = [
    path('', include(router.urls)),
]
