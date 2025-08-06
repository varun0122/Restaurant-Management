from rest_framework import serializers
from .models import Customer

class SendOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp = serializers.CharField()
    table_number = serializers.IntegerField()

class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializes customer data.
    This version is corrected to only include fields that exist on the Customer model.
    """
    class Meta:
        model = Customer
        # --- THE FIX IS HERE ---
        # We have removed 'table_number' from this list because it is no longer
        # part of the Customer model.
        fields = ['id', 'phone_number', 'last_login']

