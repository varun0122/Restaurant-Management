from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Table
from .serializers import TableSerializer

class TableViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing table instances and their QR codes.
    """
    permission_classes = [IsAdminUser]
    queryset = Table.objects.all()
    serializer_class = TableSerializer

    # --- THIS IS THE FIX ---
    # This method passes the request context to the serializer,
    # which is necessary for the SerializerMethodField to build the full URL.
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
