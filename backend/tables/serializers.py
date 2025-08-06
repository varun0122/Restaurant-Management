from rest_framework import serializers
from .models import Table

class TableSerializer(serializers.ModelSerializer):
    # This field will now automatically build the full URL for the image
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Table
        # We will use 'qr_code_url' in the frontend instead of the default 'qr_code'
        fields = ['id', 'table_number', 'qr_code_url']

    def get_qr_code_url(self, obj):
        request = self.context.get('request')
        if obj.qr_code and request:
            # This builds the full URL, e.g., http://127.0.0.1:8000/media/qr_codes/table-1-qr.png
            return request.build_absolute_uri(obj.qr_code.url)
        return None
