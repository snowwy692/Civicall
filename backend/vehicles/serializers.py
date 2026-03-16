from rest_framework import serializers
from .models import Vehicle
from communities.serializers import UserProfileSerializer, CommunitySerializer

class VehicleSerializer(serializers.ModelSerializer):
    owner = UserProfileSerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'community', 'vehicle_type', 'model', 
            'registration_number', 'color', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class VehicleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['community', 'vehicle_type', 'model', 'registration_number', 'color'] 