from rest_framework import serializers
from .models import Notice
from communities.serializers import UserProfileSerializer, CommunitySerializer

class NoticeSerializer(serializers.ModelSerializer):
    posted_by = UserProfileSerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'message', 'community', 'posted_by', 'image', 
            'attachment', 'is_pinned', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class NoticeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ['title', 'message', 'community', 'image', 'attachment', 'is_pinned']
    
    def validate(self, data):
        """
        Custom validation for notice creation
        """
        # Ensure title is not empty
        if not data.get('title', '').strip():
            raise serializers.ValidationError("Title cannot be empty")
        
        # Ensure message is not empty
        if not data.get('message', '').strip():
            raise serializers.ValidationError("Message cannot be empty")
        
        # Validate community exists and user is manager of that community
        community = data.get('community')
        if not community:
            raise serializers.ValidationError("Community is required")
        
        return data
    
    def create(self, validated_data):
        """
        Custom create method to handle file uploads
        """
        # Handle file uploads
        image = validated_data.get('image')
        attachment = validated_data.get('attachment')
        
        notice = Notice.objects.create(
            title=validated_data['title'],
            message=validated_data['message'],
            community=validated_data['community'],
            posted_by=validated_data.get('posted_by'),
            image=image,
            attachment=attachment,
            is_pinned=validated_data.get('is_pinned', False)
        )
        
        return notice 