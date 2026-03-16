from rest_framework import serializers
from .models import Event, EventRSVP
from communities.serializers import UserProfileSerializer, CommunitySerializer
from datetime import date

class EventSerializer(serializers.ModelSerializer):
    created_by = UserProfileSerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    rsvp_count = serializers.SerializerMethodField()
    user_rsvp = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'community', 'created_by', 'date', 
            'time', 'venue', 'is_active', 'rsvp_count', 'user_rsvp', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_rsvp_count(self, obj):
        return obj.rsvps.count()
    
    def get_user_rsvp(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rsvp = obj.rsvps.get(member=request.user.profile)
                return rsvp.response
            except EventRSVP.DoesNotExist:
                return None
        return None

class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['title', 'description', 'community', 'date', 'time', 'venue']
    
    def validate(self, data):
        """
        Custom validation for event creation
        """
        # Ensure title is not empty
        if not data.get('title', '').strip():
            raise serializers.ValidationError("Title cannot be empty")
        
        # Ensure description is not empty
        if not data.get('description', '').strip():
            raise serializers.ValidationError("Description cannot be empty")
        
        # Ensure venue is not empty
        if not data.get('venue', '').strip():
            raise serializers.ValidationError("Venue cannot be empty")
        
        # Validate community exists
        community = data.get('community')
        if not community:
            raise serializers.ValidationError("Community is required")
        
        # Validate date is not in the past
        event_date = data.get('date')
        if event_date and event_date < date.today():
            raise serializers.ValidationError("Event date cannot be in the past")
        
        return data

class EventRSVPSerializer(serializers.ModelSerializer):
    member = UserProfileSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    
    class Meta:
        model = EventRSVP
        fields = ['id', 'event', 'member', 'response', 'created_at']
        read_only_fields = ['created_at']

class EventRSVPCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRSVP
        fields = ['response'] 