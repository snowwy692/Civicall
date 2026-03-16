from django.db import models
from django.contrib.auth.models import User
from communities.models import Community, UserProfile
from datetime import timedelta
from django.utils import timezone

class ComplaintCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='complaint_categories')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Complaint Categories"
        unique_together = ['name', 'community']
    
    def __str__(self):
        return f"{self.name} - {self.community.name}"

class Complaint(models.Model):
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(ComplaintCategory, on_delete=models.CASCADE, related_name='complaints')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='complaints')
    submitted_by = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='submitted_complaints')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    image = models.ImageField(upload_to='complaint_images/', blank=True, null=True)
    admin_remarks = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name='resolved_complaints')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.community.name}"
    
    def save(self, *args, **kwargs):
        # Check for duplicate complaints
        if not self.pk:  # Only check on creation
            now = timezone.now()
            similar_complaints = Complaint.objects.filter(
                category=self.category,
                community=self.community,
                created_at__gte=now - timedelta(hours=24)
            )
            if similar_complaints.exists():
                self._is_duplicate = True
        super().save(*args, **kwargs)
    
    @property
    def is_duplicate(self):
        """Check if this complaint is similar to recent ones"""
        if not self.pk:
            return getattr(self, '_is_duplicate', False)
        similar_complaints = Complaint.objects.filter(
            category=self.category,
            community=self.community,
            created_at__gte=self.created_at - timedelta(hours=24)
        ).exclude(id=self.id)
        return similar_complaints.exists() 