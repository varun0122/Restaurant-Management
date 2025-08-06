from django.shortcuts import render

# Create your views here.
# inventory/views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Ingredient
from .serializers import IngredientSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ingredients to be viewed or edited.
    Only accessible by admin users.
    """
    queryset = Ingredient.objects.all().order_by('name')
    serializer_class = IngredientSerializer
    permission_classes = [IsAdminUser]

