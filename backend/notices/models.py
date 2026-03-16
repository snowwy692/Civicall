from django.db import models
from communities.models import Community, UserProfile

class Notice(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='notices')
    posted_by = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='posted_notices')
    image = models.ImageField(upload_to='notice_images/', blank=True, null=True)
    attachment = models.FileField(upload_to='notice_attachments/', blank=True, null=True)
    is_pinned = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.community.name}" 