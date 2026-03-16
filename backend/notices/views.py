from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Notice
from .serializers import NoticeSerializer, NoticeCreateSerializer
from communities.models import CommunityMembership, Notification, AuditLog

class IsCommunityManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only managers can create/edit notices
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.is_manager

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [IsCommunityManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['community', 'is_pinned', 'is_active']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_pinned']
    ordering = ['-is_pinned', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NoticeCreateSerializer
        return NoticeSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see notices for communities they manage
            return Notice.objects.filter(community__admin=user.profile)
        else:
            # Members can only see notices for communities they're approved members of
            return Notice.objects.filter(
                community__members=user.profile,
                community__communitymembership__status='approved'
            ).distinct()
    
    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        community = serializer.validated_data['community']
        
        # Ensure only managers can create notices
        if not user_profile.is_manager:
            raise permissions.PermissionDenied("Only managers can create notices.")
        
        # Ensure manager can only create notices for communities they manage
        if community.admin != user_profile:
            raise permissions.PermissionDenied("You can only create notices for communities you manage.")
        
        notice = serializer.save(posted_by=user_profile)
        
        # Notify all approved members of the community
        members = CommunityMembership.objects.filter(
            community=community, 
            status='approved'
        ).select_related('member')
        
        recipients = [m.member for m in members]
        
        # Don't notify the manager who posted the notice
        if user_profile in recipients:
            recipients.remove(user_profile)
        
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                community=community,
                message=f"New notice posted: {notice.title}",
                url=f"/communities/{community.id}/notices/{notice.id}/"
            )
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='notice_created',
            message=f"Notice '{notice.title}' created by {user_profile.user.username} in {community.name}"
        )
    
    def perform_update(self, serializer):
        user_profile = self.request.user.profile
        notice = self.get_object()
        
        # Ensure only managers can update notices
        if not user_profile.is_manager:
            raise permissions.PermissionDenied("Only managers can update notices.")
        
        # Ensure manager can only update notices for communities they manage
        if notice.community.admin != user_profile:
            raise permissions.PermissionDenied("You can only update notices for communities you manage.")
        
        serializer.save()
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=notice.community,
            action='notice_updated',
            message=f"Notice '{notice.title}' updated by {user_profile.user.username}"
        )
    
    def perform_destroy(self, instance):
        user_profile = self.request.user.profile
        
        # Ensure only managers can delete notices
        if not user_profile.is_manager:
            raise permissions.PermissionDenied("Only managers can delete notices.")
        
        # Ensure manager can only delete notices for communities they manage
        if instance.community.admin != user_profile:
            raise permissions.PermissionDenied("You can only delete notices for communities you manage.")
        
        instance.delete()
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=instance.community,
            action='notice_deleted',
            message=f"Notice '{instance.title}' deleted by {user_profile.user.username}"
        ) 