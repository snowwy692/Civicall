from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import models
from .models import UserProfile, Community, CommunityMembership, Notification, AuditLog
from .serializers import (
    UserProfileSerializer, CommunitySerializer, CommunityCreateSerializer,
    CommunityMembershipSerializer, CommunityJoinSerializer, CommunityApplySerializer,
    MembershipApprovalSerializer, CommunityUpdateSerializer, NotificationSerializer,
    AuditLogSerializer
)

class IsManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.is_manager

class IsCommunityAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and obj.admin == request.user.profile

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CommunityViewSet(viewsets.ModelViewSet):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer

    def get_permissions(self):
        # Allow all authenticated users for join/apply/invite/accept_invite and related actions
        if self.action in [
            'join', 'apply', 'invite', 'accept_invite',
            'members', 'pending_applications', 'approved_members',
            'community_stats', 'my_managed_communities', 'manager_stats', 'my_communities'
        ]:
            return [permissions.IsAuthenticated()]
        return [IsManagerOrReadOnly()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommunityCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CommunityUpdateSerializer
        return CommunitySerializer

    def get_queryset(self):
        user = self.request.user
        # If user is not authenticated, show only public communities
        if not user.is_authenticated or not hasattr(user, 'profile'):
            return Community.objects.filter(community_type='public')
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see all communities
            return Community.objects.all()
        else:
            # Members can see:
            # 1. Public communities
            # 2. Communities they're approved members of
            # 3. Communities they're admin of (even if private)
            # 4. Private communities they can apply to (not already members)
            return Community.objects.filter(
                models.Q(community_type='public') |
                models.Q(members=user.profile, communitymembership__status='approved') |
                models.Q(admin=user.profile) |
                models.Q(community_type='private')
            ).distinct()
    
    def perform_create(self, serializer):
        community = serializer.save(admin=self.request.user.profile)
        # Ensure admin is also an approved member
        CommunityMembership.objects.get_or_create(
            community=community,
            member=self.request.user.profile,
            defaults={'status': 'approved'}
        )
        return community
    
    def perform_update(self, serializer):
        # Only community admin can update
        if serializer.instance.admin != self.request.user.profile:
            raise permissions.PermissionDenied("Only community admin can update this community")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only community admin can delete
        if instance.admin != self.request.user.profile:
            raise permissions.PermissionDenied("Only community admin can delete this community")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        community = self.get_object()
        user_profile = request.user.profile
        
        if community.community_type == 'private':
            return Response(
                {'error': 'This is a private community. Please apply for membership.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership, created = CommunityMembership.objects.get_or_create(
            community=community,
            member=user_profile,
            defaults={'status': 'approved'}
        )
        
        if not created and membership.status == 'approved':
            return Response(
                {'error': 'You are already a member of this community.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='membership_changed',
            message=f"{user_profile.user.username} joined community '{community.name}'"
        )
        return Response({'message': 'Successfully joined the community'})
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        community = self.get_object()
        user_profile = request.user.profile
        
        # Check if community is private
        if community.community_type == 'public':
            return Response(
                {'error': 'This is a public community. You can join directly.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a member
        try:
            existing_membership = CommunityMembership.objects.get(
                community=community,
                member=user_profile
            )
            
            if existing_membership.status == 'pending':
                return Response(
                    {'error': 'Your application is already pending.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_membership.status == 'approved':
                return Response(
                    {'error': 'You are already a member of this community.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_membership.status == 'rejected':
                # Allow re-applying if previously rejected
                existing_membership.status = 'pending'
                existing_membership.save()
                
                # Audit log
                AuditLog.objects.create(
                    user=user_profile,
                    community=community,
                    action='membership_changed',
                    message=f"{user_profile.user.username} reapplied to community '{community.name}'"
                )
                return Response({'message': 'Application submitted successfully'})
                
        except CommunityMembership.DoesNotExist:
            # Create new membership
            membership = CommunityMembership.objects.create(
                community=community,
                member=user_profile,
                status='pending'
            )
            
            # Audit log
            AuditLog.objects.create(
                user=user_profile,
                community=community,
                action='membership_changed',
                message=f"{user_profile.user.username} applied to community '{community.name}'"
            )
            return Response({'message': 'Application submitted successfully'})
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        community = self.get_object()
        memberships = CommunityMembership.objects.filter(community=community)
        serializer = CommunityMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def pending_applications(self, request, pk=None):
        community = self.get_object()
        # Allow if user is the admin of this specific community
        if community.admin != request.user.profile:
            return Response(
                {'error': 'Only community admins can view pending applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_memberships = CommunityMembership.objects.filter(
            community=community,
            status='pending'
        )
        serializer = CommunityMembershipSerializer(pending_memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def approved_members(self, request, pk=None):
        community = self.get_object()
        approved_memberships = CommunityMembership.objects.filter(
            community=community,
            status='approved'
        )
        serializer = CommunityMembershipSerializer(approved_memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def community_stats(self, request, pk=None):
        community = self.get_object()
        
        stats = {
            'total_members': CommunityMembership.objects.filter(
                community=community, 
                status='approved'
            ).count(),
            'pending_applications': CommunityMembership.objects.filter(
                community=community, 
                status='pending'
            ).count(),
            'rejected_applications': CommunityMembership.objects.filter(
                community=community, 
                status='rejected'
            ).count(),
            'is_admin': community.admin == request.user.profile if hasattr(request.user, 'profile') else False,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def my_managed_communities(self, request):
        """Get communities managed by the current user"""
        if not hasattr(request.user, 'profile') or not request.user.profile.is_manager:
            return Response(
                {'error': 'Only managers can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        communities = Community.objects.filter(admin=request.user.profile)
        serializer = CommunitySerializer(communities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def manager_stats(self, request):
        """Get overall stats for managers"""
        if not hasattr(request.user, 'profile') or not request.user.profile.is_manager:
            return Response(
                {'error': 'Only managers can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        managed_communities = Community.objects.filter(admin=request.user.profile)
        
        stats = {
            'total_communities': managed_communities.count(),
            'public_communities': managed_communities.filter(community_type='public').count(),
            'private_communities': managed_communities.filter(community_type='private').count(),
            'total_members': sum([
                CommunityMembership.objects.filter(
                    community=community, 
                    status='approved'
                ).count() for community in managed_communities
            ]),
            'pending_applications': sum([
                CommunityMembership.objects.filter(
                    community=community, 
                    status='pending'
                ).count() for community in managed_communities
            ]),
        }
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def my_communities(self, request):
        """Get all communities the current user is a member of (approved) or manages (admin)"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'User profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        user_profile = request.user.profile
        # Communities where user is admin
        admin_communities = Community.objects.filter(admin=user_profile)
        # Communities where user is an approved member
        member_communities = Community.objects.filter(members=user_profile, communitymembership__status='approved')
        # Union, remove duplicates
        all_communities = (admin_communities | member_communities).distinct()
        serializer = CommunitySerializer(all_communities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        """Manager can invite a user to join their community by email or username."""
        community = self.get_object()
        user_profile = request.user.profile
        if community.admin != user_profile:
            return Response({'error': 'Only the community manager can invite users.'}, status=status.HTTP_403_FORBIDDEN)
        email = request.data.get('email')
        username = request.data.get('username')
        if not email and not username:
            return Response({'error': 'Email or username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if email:
                user = User.objects.get(email=email)
            else:
                user = User.objects.get(username=username)
            invited_profile = user.profile
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Don't allow inviting self
        if invited_profile == user_profile:
            return Response({'error': 'You cannot invite yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        # Don't allow duplicate invites/memberships
        membership, created = CommunityMembership.objects.get_or_create(
            community=community,
            member=invited_profile,
            defaults={'status': 'invited'}
        )
        if not created:
            return Response({'error': f'User already has a membership with status: {membership.status}'}, status=status.HTTP_400_BAD_REQUEST)
        # TODO: Send notification/email to invited user
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='membership_changed',
            message=f"{user_profile.user.username} invited {invited_profile.user.username} to community '{community.name}'"
        )
        return Response({'message': 'User invited successfully.'})

    @action(detail=True, methods=['post'])
    def accept_invite(self, request, pk=None):
        """User accepts an invite to join a community."""
        community = self.get_object()
        user_profile = request.user.profile
        try:
            membership = CommunityMembership.objects.get(community=community, member=user_profile, status='invited')
        except CommunityMembership.DoesNotExist:
            return Response({'error': 'No invite found for this community.'}, status=status.HTTP_404_NOT_FOUND)
        membership.status = 'approved'
        membership.approved_at = timezone.now()
        membership.approved_by = community.admin
        membership.save()
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='membership_changed',
            message=f"{user_profile.user.username} accepted invite to community '{community.name}'"
        )
        return Response({'message': 'You have joined the community.'})

class CommunityMembershipViewSet(viewsets.ModelViewSet):
    queryset = CommunityMembership.objects.all()
    serializer_class = CommunityMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see memberships for communities they manage
            return CommunityMembership.objects.filter(
                community__admin=user.profile
            )
        else:
            # Members can only see their own memberships
            return CommunityMembership.objects.filter(member=user.profile)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        membership = self.get_object()
        
        if not request.user.profile.is_manager or membership.community.admin != request.user.profile:
            return Response(
                {'error': 'Only community admins can approve applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MembershipApprovalSerializer(data=request.data)
        if serializer.is_valid():
            status_value = serializer.validated_data['status']
            membership.status = status_value
            if status_value == 'approved':
                membership.approved_at = timezone.now()
                membership.approved_by = request.user.profile
            membership.save()
            
            # Audit log
            AuditLog.objects.create(
                user=request.user.profile,
                community=membership.community,
                action='membership_changed',
                message=f"{request.user.profile.user.username} approved membership for {membership.member.user.username} in community '{membership.community.name}'"
            )
            return Response({'message': f'Application {status_value} successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        membership = self.get_object()
        
        if not request.user.profile.is_manager or membership.community.admin != request.user.profile:
            return Response(
                {'error': 'Only community admins can reject applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        membership.status = 'rejected'
        membership.save()
        
        # Audit log
        AuditLog.objects.create(
            user=request.user.profile,
            community=membership.community,
            action='membership_changed',
            message=f"{request.user.profile.user.username} rejected membership for {membership.member.user.username} in community '{membership.community.name}'"
        )
        return Response({'message': 'Application rejected successfully'})
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        membership = self.get_object()
        
        if not request.user.profile.is_manager or membership.community.admin != request.user.profile:
            return Response(
                {'error': 'Only community admins can remove members.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        membership.delete()
        # Audit log
        AuditLog.objects.create(
            user=request.user.profile,
            community=membership.community,
            action='membership_changed',
            message=f"{request.user.profile.user.username} removed {membership.member.user.username} from community '{membership.community.name}'"
        )
        return Response({'message': 'Member removed successfully'})

    @action(detail=False, methods=['get'])
    def my_invites(self, request):
        """Get all community invites for the current user (status='invited')."""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'User profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        user_profile = request.user.profile
        invites = CommunityMembership.objects.filter(member=user_profile, status='invited')
        serializer = CommunityMembershipSerializer(invites, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_memberships(self, request):
        """Get all memberships for the current user."""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'User profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        user_profile = request.user.profile
        memberships = CommunityMembership.objects.filter(
            member=user_profile
        ).select_related('community')
        serializer = CommunityMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user.profile)

    def perform_update(self, serializer):
        # Only allow marking as read
        instance = serializer.save()
        if not instance.is_read:
            instance.is_read = True
            instance.save()

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        # Superusers see all logs, managers see their communities, members see their own actions
        if user.is_superuser:
            return AuditLog.objects.all()
        elif hasattr(user, 'profile') and user.profile.is_manager:
            return AuditLog.objects.filter(community__admin=user.profile)
        else:
            return AuditLog.objects.filter(user=user.profile)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    print(f"DEBUG: my_profile called for user: {request.user.username}")
    print(f"DEBUG: User has profile: {hasattr(request.user, 'profile')}")
    if hasattr(request.user, 'profile'):
        print(f"DEBUG: Profile exists: {request.user.profile}")
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    else:
        print(f"DEBUG: Creating profile for user: {request.user.username}")
        # Create profile if it doesn't exist
        profile = UserProfile.objects.create(
            user=request.user,
            user_type='member'
        )
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def promote_to_manager(request):
    """Promote a user to manager (admin only)"""
    if not request.user.is_superuser:
        return Response(
            {'error': 'Only superusers can promote users to managers.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user_id = request.data.get('user_id')
    if not user_id:
        return Response(
            {'error': 'user_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'user_type': 'manager'}
        )
        if not created:
            profile.user_type = 'manager'
            profile.save()
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )