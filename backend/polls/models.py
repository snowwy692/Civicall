from django.db import models
from communities.models import Community, UserProfile

class Poll(models.Model):
    POLL_TYPES = [
        ('yes_no', 'Yes/No'),
        ('multiple_choice', 'Multiple Choice'),
    ]
    
    question = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='polls')
    created_by = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='created_polls')
    poll_type = models.CharField(max_length=15, choices=POLL_TYPES, default='yes_no')
    options = models.JSONField(default=list)  # For multiple choice polls
    is_active = models.BooleanField(default=True)
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.question} - {self.community.name}"

class PollVote(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='votes')
    voter = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='poll_votes')
    choice = models.CharField(max_length=100)  # 'yes', 'no', or option text
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['poll', 'voter']
    
    def __str__(self):
        return f"{self.voter.user.username} - {self.poll.question} ({self.choice})" 