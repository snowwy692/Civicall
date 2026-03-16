from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event, EventRSVP
from .serializers import (
    EventSerializer, EventCreateSerializer, EventRSVPSerializer, EventRSVPCreateSerializer
)
from communities.models import CommunityMembership, Notification, AuditLog

class IsCommunityManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only managers can create/edit events
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.is_manager

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsCommunityManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['community', 'is_active']
    search_fields = ['title', 'description', 'venue']
    ordering_fields = ['date', 'time', 'created_at']
    ordering = ['date', 'time']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        return EventSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if not user.is_authenticated:
            return Event.objects.none()
        
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see events for communities they manage
            return Event.objects.filter(community__admin=user.profile)
        else:
            # Members can only see events for communities they're approved members of
            return Event.objects.filter(
                community__members=user.profile,
                community__communitymembership__status='approved'
            ).distinct()
    
    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        community = serializer.validated_data['community']
        
        # Ensure only managers can create events
        if not user_profile.is_manager:
            raise permissions.PermissionDenied("Only managers can create events.")
        
        # Ensure manager can only create events for communities they manage
        if community.admin != user_profile:
            raise permissions.PermissionDenied("You can only create events for communities you manage.")
        
        event = serializer.save(created_by=user_profile)
        
        # Notify all approved members of the community
        members = CommunityMembership.objects.filter(
            community=community, 
            status='approved'
        ).select_related('member')
        
        recipients = [m.member for m in members]
        
        # Don't notify the manager who created the event
        if user_profile in recipients:
            recipients.remove(user_profile)
        
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                community=community,
                message=f"New event created: {event.title}",
                url=f"/communities/{community.id}/events/{event.id}/"
            )
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='event_created',
            message=f"Event '{event.title}' created by {user_profile.user.username} in {community.name}"
        )
    
    def perform_update(self, serializer):
        user_profile = self.request.user.profile
        event = self.get_object()
        
        # Ensure only managers can update events
        if not user_profile.is_manager:
            raise permissions.PermissionDenied("Only managers can update events.")
        
        # Ensure manager can only update events for communities they manage
        if event.community.admin != user_profile:
            raise permissions.PermissionDenied("You can only update events for communities you manage.")
        
        serializer.save()
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=event.community,
            action='event_updated',
            message=f"Event '{event.title}' updated by {user_profile.user.username}"
        )
    
    def perform_destroy(self, instance):
        user_profile = self.request.user.profile
        
        # Ensure only managers can delete events
        if not user_profile.is_manager:
            raise permissions.PermissionDenied("Only managers can delete events.")
        
        # Ensure manager can only delete events for communities they manage
        if instance.community.admin != user_profile:
            raise permissions.PermissionDenied("You can only delete events for communities you manage.")
        
        instance.delete()
        
        # Audit log
        AuditLog.objects.create(
            user=user_profile,
            community=instance.community,
            action='event_deleted',
            message=f"Event '{instance.title}' deleted by {user_profile.user.username}"
        )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rsvp(self, request, pk=None):
        event = self.get_object()
        user_profile = request.user.profile
        
        # Check if user is a member of the event's community
        if not event.community.members.filter(id=user_profile.id, communitymembership__status='approved').exists():
            raise permissions.PermissionDenied("You must be an approved member of this community to RSVP to events.")
        
        serializer = EventRSVPCreateSerializer(data=request.data)
        if serializer.is_valid():
            response = serializer.validated_data['response']
            
            rsvp, created = EventRSVP.objects.get_or_create(
                event=event,
                member=user_profile,
                defaults={'response': response}
            )
            
            if not created:
                rsvp.response = response
                rsvp.save()
            
            return Response({'message': f'RSVP updated: {response}'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def rsvps(self, request, pk=None):
        event = self.get_object()
        rsvps = event.rsvps.all()
        serializer = EventRSVPSerializer(rsvps, many=True)
        return Response(serializer.data)

class EventRSVPViewSet(viewsets.ModelViewSet):
    queryset = EventRSVP.objects.all()
    serializer_class = EventRSVPSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EventRSVP.objects.filter(member=self.request.user.profile) 