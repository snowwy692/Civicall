from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from communities.models import Community
from complaints.models import Complaint
from notices.models import Notice
from events.models import Event
from polls.models import Poll

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    profile = user.profile

    # For managers: communities they manage; for users: communities they belong to
    if hasattr(profile, 'is_manager') and profile.is_manager:
        comms = Community.objects.filter(admin=profile)
    else:
        comms = Community.objects.filter(members=profile, communitymembership__status='approved')

    comm_ids = list(comms.values_list('id', flat=True))

    # Counts
    total_communities = comms.count()
    active_complaints = Complaint.objects.filter(
        community__in=comm_ids, status__in=['open','in_progress']
    ).count() if comm_ids else 0
    
    total_notices = Notice.objects.filter(
        community__in=comm_ids
    ).count() if comm_ids else 0
    
    total_events = Event.objects.filter(
        community__in=comm_ids
    ).count() if comm_ids else 0
    
    total_polls = Poll.objects.filter(
        community__in=comm_ids
    ).count() if comm_ids else 0

    # Recent items
    recent_notices = Notice.objects.filter(
        community__in=comm_ids
    ).order_by('-created_at')[:5] if comm_ids else []
    
    upcoming_events = Event.objects.filter(
        community__in=comm_ids, date__gte=timezone.now().date()
    ).order_by('date')[:5] if comm_ids else []
    
    recent_complaints = Complaint.objects.filter(
        community__in=comm_ids
    ).order_by('-created_at')[:5] if comm_ids else []

    return Response({
        "total_communities": total_communities,
        "active_complaints": active_complaints,
        "total_notices": total_notices,
        "total_events": total_events,
        "total_polls": total_polls,
        "recent_notices": [
            {
                "id": n.id, 
                "title": n.title, 
                "created_at": n.created_at,
                "community": n.community.name if n.community else None
            }
            for n in recent_notices
        ],
        "upcoming_events": [
            {
                "id": e.id, 
                "title": e.title, 
                "date": e.date,
                "time": e.time,
                "venue": e.venue,
                "community": e.community.name if e.community else None
            }
            for e in upcoming_events
        ],
        "recent_complaints": [
            {
                "id": c.id,
                "title": c.title,
                "status": c.status,
                "priority": c.priority,
                "created_at": c.created_at,
                "community": c.community.name if c.community else None
            }
            for c in recent_complaints
        ]
    })
