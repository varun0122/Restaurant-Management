# accounts/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for reading user data.
    """
    class Meta:
        model = User
        # We only expose non-sensitive fields for reading.
        fields = ['id', 'username', 'first_name', 'last_name', 'is_staff', 'is_superuser']


class UserWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating user data.
    Handles password hashing.
    """
    # Make password write-only for security.
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'is_staff', 'is_superuser']

    def create(self, validated_data):
        # Create a new user with a hashed password.
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        # Update user instance.
        # If a password is provided, hash it before saving.
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        # Update other fields.
        return super().update(instance, validated_data)
