from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Poll, PollVote
from .serializers import (
    PollSerializer, PollCreateSerializer, PollVoteSerializer, PollVoteCreateSerializer
)
from communities.models import CommunityMembership, Notification, AuditLog

class IsAuthenticatedForMutations(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and hasattr(request.user, 'profile')

class PollViewSet(viewsets.ModelViewSet):
    queryset = Poll.objects.all()
    serializer_class = PollSerializer
    permission_classes = [IsAuthenticatedForMutations]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['community', 'is_active', 'poll_type']
    search_fields = ['question', 'description']
    ordering_fields = ['created_at', 'end_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PollCreateSerializer
        return PollSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'profile'):
            return Poll.objects.none()
        profile = user.profile
        # Show polls from communities the user manages OR is an approved member of
        return Poll.objects.filter(
            Q(community__admin=profile) |
            Q(community__members=profile, community__communitymembership__status='approved')
        ).distinct()
    
    def _is_approved_member(self, community, profile):
        return CommunityMembership.objects.filter(
            community=community,
            member=profile,
            status='approved'
        ).exists()

    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        community = serializer.validated_data['community']
        
        # Allow create if admin of the community OR approved member
        if community.admin != user_profile and not self._is_approved_member(community, user_profile):
            raise permissions.PermissionDenied("You can only create polls in communities you belong to.")
        
        poll = serializer.save(created_by=user_profile)
        
        # Notify all approved members (exclude creator)
        members = CommunityMembership.objects.filter(
            community=community,
            status='approved'
        ).select_related('member')
        recipients = [m.member for m in members if m.member != user_profile]
        # Optionally notify admin if not creator
        if community.admin != user_profile and community.admin not in recipients:
            recipients.append(community.admin)
        
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                community=community,
                message=f"New poll created: {poll.question}",
                url=f"/communities/{community.id}/polls/{poll.id}/"
            )
        
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='poll_created',
            message=f"Poll '{poll.question}' created by {user_profile.user.username}"
        )
    
    def perform_update(self, serializer):
        user_profile = self.request.user.profile
        poll = self.get_object()
        
        if not (poll.community.admin == user_profile or poll.created_by == user_profile):
            raise permissions.PermissionDenied("Only the community admin or the poll creator can update this poll.")
        
        serializer.save()
        
        AuditLog.objects.create(
            user=user_profile,
            community=poll.community,
            action='poll_updated',
            message=f"Poll '{poll.question}' updated by {user_profile.user.username}"
        )
    
    def perform_destroy(self, instance):
        user_profile = self.request.user.profile
        if not (instance.community.admin == user_profile or instance.created_by == user_profile):
            raise permissions.PermissionDenied("Only the community admin or the poll creator can delete this poll.")
        
        community = instance.community
        question = instance.question
        instance.delete()
        
        AuditLog.objects.create(
            user=user_profile,
            community=community,
            action='poll_deleted',
            message=f"Poll '{question}' deleted by {user_profile.user.username}"
        )
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        poll = self.get_object()
        user_profile = request.user.profile
        
        # Ensure voter is admin or approved member of the community
        if poll.community.admin != user_profile and not self._is_approved_member(poll.community, user_profile):
            return Response({'error': 'Only community members can vote.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PollVoteCreateSerializer(data=request.data)
        if serializer.is_valid():
            choice = serializer.validated_data['choice']
            
            # Validate choice based on poll type
            if poll.poll_type == 'yes_no' and choice not in ['yes', 'no']:
                return Response(
                    {'error': 'Invalid choice for yes/no poll'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif poll.poll_type == 'multiple_choice' and choice not in poll.options:
                return Response(
                    {'error': 'Invalid choice for multiple choice poll'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            vote, created = PollVote.objects.get_or_create(
                poll=poll,
                voter=user_profile,
                defaults={'choice': choice}
            )
            
            if not created:
                vote.choice = choice
                vote.save()
            
            return Response({'message': f'Vote recorded: {choice}'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        poll = self.get_object()
        votes = poll.votes.all()
        
        # Calculate results
        results = {}
        if poll.poll_type == 'yes_no':
            results = {
                'yes': votes.filter(choice='yes').count(),
                'no': votes.filter(choice='no').count(),
            }
        else:
            for option in poll.options:
                results[option] = votes.filter(choice=option).count()
        
        return Response({
            'poll': PollSerializer(poll, context={'request': request}).data,
            'results': results,
            'total_votes': votes.count()
        })

class PollVoteViewSet(viewsets.ModelViewSet):
    queryset = PollVote.objects.all()
    serializer_class = PollVoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PollVote.objects.filter(voter=self.request.user.profile) 