# discounts/views.py

from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser, AllowAny
from .models import Discount
from .serializers import DiscountSerializer

# ViewSet for Admins to manage all discounts (Create, Read, Update, Delete)
class DiscountViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows discount codes to be viewed or edited.
    Only accessible by admin users.
    """
    queryset = Discount.objects.all().order_by('code')
    serializer_class = DiscountSerializer
    permission_classes = [IsAdminUser]


# --- NEW: ViewSet for Customers to see public offers ---
# This is a read-only view that only lists active, public discounts.
class PublicDiscountsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    API endpoint that lists all active, public-facing discounts.
    Accessible by anyone.
    """
    queryset = Discount.objects.filter(is_active=True)
    serializer_class = DiscountSerializer
    permission_classes = [AllowAny] # Open to the public
