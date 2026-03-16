from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Complaint, ComplaintCategory
from .serializers import (
    ComplaintSerializer, ComplaintCreateSerializer, ComplaintUpdateSerializer,
    ComplaintCategorySerializer, ComplaintFilterSerializer
)
from communities.models import Notification, CommunityMembership, AuditLog

class IsCommunityAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.is_manager

class ComplaintCategoryViewSet(viewsets.ModelViewSet):
    queryset = ComplaintCategory.objects.all()
    serializer_class = ComplaintCategorySerializer
    permission_classes = [IsCommunityAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['community']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see categories for communities they manage
            return ComplaintCategory.objects.filter(community__admin=user.profile)
        else:
            # Members can see categories for communities they're part of
            return ComplaintCategory.objects.filter(
                community__members=user.profile,
                community__communitymembership__status='approved'
            )

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    module_flag = 'complaints_enabled'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'community']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ComplaintCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ComplaintUpdateSerializer
        return ComplaintSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see complaints for communities they manage
            queryset = Complaint.objects.filter(community__admin=user.profile)
            return queryset
        else:
            # Members can see complaints for communities they're part of
            queryset = Complaint.objects.filter(
                community__members=user.profile,
                community__communitymembership__status='approved'
            )
            return queryset
    
    def perform_create(self, serializer):
        community = serializer.validated_data['community']
        user_profile = self.request.user.profile
        
        # Only allow if user is an approved member or the manager
        is_member = CommunityMembership.objects.filter(
            community=community,
            member=user_profile,
            status='approved'
        ).exists()
        is_manager = community.admin == user_profile
        
        if not (is_member or is_manager):
            raise permissions.PermissionDenied("You must be a member of this community to file a complaint.")
        
        complaint = serializer.save(submitted_by=user_profile)
        
        # Notify all approved members and the manager
        members = CommunityMembership.objects.filter(community=community, status='approved').select_related('member')
        recipients = [m.member for m in members]
        if community.admin not in recipients:
            recipients.append(community.admin)
        
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                community=community,
                message=f"New complaint filed: {complaint.title}",
                url=f"/communities/{community.id}/complaints/{complaint.id}/"
            )
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='complaint_created',
            message=f"Complaint '{complaint.title}' created by {user_profile.user.username}"
        )
    
    def perform_update(self, serializer):
        user = self.request.user
        complaint = self.get_object()
        
        print(f"Updating complaint {complaint.id} by user {user.username}")
        print(f"User is manager: {getattr(user.profile, 'is_manager', False)}")
        print(f"Complaint community admin: {complaint.community.admin.user.username}")
        print(f"Current user ID: {user.id}")
        print(f"Community admin user ID: {complaint.community.admin.user.id}")
        print(f"Update data: {serializer.validated_data}")
        
        # Check if user can update this complaint
        if hasattr(user, 'profile') and getattr(user.profile, 'is_manager', False):
            # Managers can update any complaint (simplified for now)
            print(f"Manager {user.username} updating complaint")
            serializer.save()
        else:
            # Members can only update their own complaints
            if complaint.submitted_by == user.profile:
                print(f"Member {user.username} updating their own complaint")
                serializer.save()
            else:
                print(f"Member {user.username} denied - not complaint owner")
                raise permissions.PermissionDenied("You can only update your own complaints.")
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        complaint = self.get_object()
        
        if not request.user.profile.is_manager or complaint.community.admin != request.user.profile:
            return Response(
                {'error': 'Only community admins can resolve complaints.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        complaint.status = 'resolved'
        complaint.resolved_at = timezone.now()
        complaint.resolved_by = request.user.profile
        complaint.save()
        
        serializer = self.get_serializer(complaint)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_complaints(self, request):
        """Get complaints submitted by the current user"""
        complaints = self.get_queryset().filter(submitted_by=request.user.profile)
        serializer = self.get_serializer(complaints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending complaints (for admins)"""
        if not request.user.profile.is_manager:
            return Response(
                {'error': 'Only managers can view pending complaints.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        complaints = self.get_queryset().filter(status='open')
        serializer = self.get_serializer(complaints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent and critical complaints"""
        complaints = self.get_queryset().filter(priority__in=['urgent', 'critical'])
        serializer = self.get_serializer(complaints, many=True)
        return Response(serializer.data)