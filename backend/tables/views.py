from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Table

@api_view(['GET'])
def list_tables(request):
    data = [{"id": t.id, "number": t.number, "qr": t.qr_image.url} for t in Table.objects.all()]
    return Response(data)
