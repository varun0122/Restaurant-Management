# discounts/views.py

from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated # Import IsAuthenticated
from .models import Discount
from .serializers import DiscountSerializer

# 1. Admin View (No Change)
# Admins can see and manage ALL discounts, including hidden ones.
class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().order_by('code')
    serializer_class = DiscountSerializer
    permission_classes = [IsAdminUser]

# 2. Public View (Updated)
# Customers see only active, public, non-hidden offers.
class PublicDiscountsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Discount.objects.filter(
        is_active=True, 
        requires_staff_approval=False, 
        is_hidden=False  # <-- Add this condition
    )
    serializer_class = DiscountSerializer
    permission_classes = [AllowAny]

# 3. Staff View (Optional but Recommended)
# Logged-in staff can see all active, non-hidden discounts they can apply.
# This would require your staff to have user accounts.
class StaffDiscountsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Discount.objects.filter(
        is_active=True,
        is_hidden=False  # <-- Staff cannot see the admin's secret discounts
    )
    serializer_class = DiscountSerializer
    # This assumes staff members are logged in. You could create a more specific IsStaff permission.
    permission_classes = [IsAuthenticated]