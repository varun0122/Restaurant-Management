# accounts/views.py

from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .serializers import UserSerializer, UserWriteSerializer

class AccountViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows admin user accounts to be viewed or edited.
    Only accessible by superusers.
    """
    # Only show users who are marked as staff (i.e., can access the admin panel).
    queryset = User.objects.filter(is_staff=True).order_by('username')
    permission_classes = [IsAdminUser] # Ensure only superusers can manage accounts

    def get_serializer_class(self):
        # Use the write serializer for create/update actions.
        if self.action in ['create', 'update', 'partial_update']:
            return UserWriteSerializer
        # Use the read serializer for list/retrieve actions.
        return UserSerializer
