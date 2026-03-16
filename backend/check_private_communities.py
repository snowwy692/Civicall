#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicall.settings')
django.setup()

from communities.models import Community, UserProfile
from django.contrib.auth.models import User

def check_communities():
    print("=== Checking Communities ===")
    
    # Get all communities
    communities = Community.objects.all()
    print(f"Total communities: {communities.count()}")
    
    for community in communities:
        print(f"- {community.name} ({community.community_type}) - Admin: {community.admin.user.username}")
    
    # Check if we have any private communities
    private_communities = Community.objects.filter(community_type='private')
    print(f"\nPrivate communities: {private_communities.count()}")
    
    # Check if we have any managers
    managers = UserProfile.objects.filter(user_type='manager')
    print(f"Managers: {managers.count()}")
    for manager in managers:
        print(f"- {manager.user.username} ({manager.user_type})")
    
    # Create test private community if none exist
    if private_communities.count() == 0:
        print("\n=== Creating Test Private Community ===")
        
        # Get or create a manager
        if managers.count() == 0:
            # Create a test manager
            test_user, created = User.objects.get_or_create(
                username='testmanager',
                defaults={'email': 'manager@test.com', 'first_name': 'Test', 'last_name': 'Manager'}
            )
            if created:
                test_user.set_password('testpass123')
                test_user.save()
            
            manager_profile, created = UserProfile.objects.get_or_create(
                user=test_user,
                defaults={'user_type': 'manager'}
            )
            if not created:
                manager_profile.user_type = 'manager'
                manager_profile.save()
        else:
            manager_profile = managers.first()
        
        # Create private community
        private_community = Community.objects.create(
            name='Private Test Community',
            description='A private community for testing applications',
            location='Test Location',
            community_type='private',
            admin=manager_profile
        )
        
        print(f"Created private community: {private_community.name}")
        print(f"Admin: {private_community.admin.user.username}")
    
    print("\n=== Current Communities ===")
    for community in Community.objects.all():
        print(f"- {community.name} ({community.community_type}) - Admin: {community.admin.user.username}")

if __name__ == '__main__':
    check_communities()
