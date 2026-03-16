from django.db import models
from communities.models import Community, UserProfile

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='events')
    created_by = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='created_events')
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
    
    def __str__(self):
        return f"{self.title} - {self.community.name}"

class EventRSVP(models.Model):
    RESPONSE_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
        ('maybe', 'Maybe'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='rsvps')
    member = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='event_rsvps')
    response = models.CharField(max_length=5, choices=RESPONSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['event', 'member']
    
    def __str__(self):
        return f"{self.member.user.username} - {self.event.title} ({self.response})" 