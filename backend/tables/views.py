from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Table
from .serializers import TableSerializer

# --- FIX: Changed from ReadOnlyModelViewSet to ModelViewSet ---
# This enables create, update, and delete actions (POST, PUT, DELETE).
class TableViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tables to be viewed or created.
    QR codes are automatically generated when a new table is created.
    """
    queryset = Table.objects.all().order_by('table_number')
    serializer_class = TableSerializer
    permission_classes = [IsAdminUser]

