from django.db import models
from communities.models import Community, UserProfile

class Vehicle(models.Model):
    VEHICLE_TYPES = [
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('scooter', 'Scooter'),
        ('truck', 'Truck'),
        ('other', 'Other'),
    ]
    
    owner = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='vehicles')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='vehicles')
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPES)
    model = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.registration_number} - {self.owner.user.username}" 