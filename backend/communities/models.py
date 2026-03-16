from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator

class UserProfile(models.Model):
    USER_TYPES = [
        ('manager', 'Manager'),
        ('member', 'Member'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='member')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.user_type}"
    
    @property
    def is_manager(self):
        return self.user_type == 'manager'

class Community(models.Model):
    COMMUNITY_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    name = models.CharField(max_length=100, validators=[MinLengthValidator(3)])
    description = models.TextField()
    location = models.CharField(max_length=200)
    community_type = models.CharField(max_length=10, choices=COMMUNITY_TYPES, default='public')
    admin = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='managed_communities')
    members = models.ManyToManyField(UserProfile, through='CommunityMembership', through_fields=('community', 'member'), related_name='joined_communities')
    
    # Enabled modules
    complaints_enabled = models.BooleanField(default=True)
    notices_enabled = models.BooleanField(default=True)
    events_enabled = models.BooleanField(default=True)
    vehicles_enabled = models.BooleanField(default=False)
    polls_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Communities"
    
    def __str__(self):
        return self.name

class CommunityMembership(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    member = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    joined_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    approved_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='approved_memberships')
    
    class Meta:
        unique_together = ('community', 'member')
    
    def __str__(self):
        return f"{self.member.user.username} - {self.community.name} ({self.status})" 

class Notification(models.Model):
    recipient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='notifications')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    url = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"To: {self.recipient.user.username} | {self.message[:30]}..." 

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('complaint_created', 'Complaint Created'),
        ('notice_created', 'Notice Created'),
        ('event_created', 'Event Created'),
        ('poll_created', 'Poll Created'),
        ('membership_changed', 'Membership Changed'),
        ('community_created', 'Community Created'),
        ('community_updated', 'Community Updated'),
        ('community_deleted', 'Community Deleted'),
    ]
    user = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.action} by {self.user} at {self.created_at}" 