from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Community, CommunityMembership, Notification, AuditLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_manager = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'is_manager', 'phone_number', 'address', 'profile_picture', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class CommunitySerializer(serializers.ModelSerializer):
    admin = UserProfileSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'description', 'location', 'community_type', 'admin',
            'complaints_enabled', 'notices_enabled', 'events_enabled', 
            'vehicles_enabled', 'polls_enabled', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.filter(communitymembership__status='approved').count()

class CommunityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = [
            'name', 'description', 'location', 'community_type',
            'complaints_enabled', 'notices_enabled', 'events_enabled', 
            'vehicles_enabled', 'polls_enabled'
        ]
    
    def to_representation(self, instance):
        # Return full community data after creation
        return CommunitySerializer(instance).data

class CommunityUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = [
            'name', 'description', 'location', 'community_type',
            'complaints_enabled', 'notices_enabled', 'events_enabled', 
            'vehicles_enabled', 'polls_enabled'
        ]
        read_only_fields = ['admin']  # Admin cannot be changed

class CommunityMembershipSerializer(serializers.ModelSerializer):
    member = UserProfileSerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    approved_by = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = CommunityMembership
        fields = ['id', 'community', 'member', 'status', 'joined_at', 'approved_at', 'approved_by']
        read_only_fields = ['joined_at', 'approved_at', 'approved_by']

class CommunityJoinSerializer(serializers.Serializer):
    community_id = serializers.IntegerField()

class CommunityApplySerializer(serializers.Serializer):
    community_id = serializers.IntegerField()

class MembershipApprovalSerializer(serializers.Serializer):
    membership_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['approved', 'rejected'])

class CommunityStatsSerializer(serializers.Serializer):
    total_members = serializers.IntegerField()
    pending_applications = serializers.IntegerField()
    rejected_applications = serializers.IntegerField()
    is_admin = serializers.BooleanField()

class ManagerStatsSerializer(serializers.Serializer):
    total_communities = serializers.IntegerField()
    public_communities = serializers.IntegerField()
    private_communities = serializers.IntegerField()
    total_members = serializers.IntegerField()
    pending_applications = serializers.IntegerField() 

class NotificationSerializer(serializers.ModelSerializer):
    community = CommunitySerializer(read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'community', 'message', 'url', 'is_read', 'created_at'] 

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'community', 'action', 'message', 'created_at'] 