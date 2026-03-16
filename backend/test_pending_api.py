#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicall.settings')
django.setup()

from communities.models import Community, CommunityMembership, UserProfile
from django.contrib.auth.models import User

def test_pending_api():
    print("=== Testing Pending Applications API ===")
    
    # Get the moksheet community
    try:
        moksheet = Community.objects.get(name='moksheet')
        print(f"Found community: {moksheet.name}")
        print(f"Admin: {moksheet.admin.user.username}")
        print(f"Admin ID: {moksheet.admin.id}")
        
        # Check pending applications
        pending = CommunityMembership.objects.filter(community=moksheet, status='pending')
        print(f"Pending applications count: {pending.count()}")
        
        for membership in pending:
            print(f"  - {membership.member.user.username} (ID: {membership.member.id})")
        
        # Get alicej user
        alicej_user = User.objects.get(username='alicej')
        alicej_profile = alicej_user.profile
        print(f"\nalicej profile: {alicej_profile}")
        print(f"alicej profile ID: {alicej_profile.id}")
        print(f"alicej is_manager: {alicej_profile.is_manager}")
        print(f"alicej user_type: {alicej_profile.user_type}")
        
        # Check if alicej is admin
        print(f"moksheet.admin == alicej_profile: {moksheet.admin == alicej_profile}")
        print(f"moksheet.admin.id == alicej_profile.id: {moksheet.admin.id == alicej_profile.id}")
        
    except Community.DoesNotExist:
        print("moksheet community not found")
    except User.DoesNotExist:
        print("alicej user not found")

if __name__ == '__main__':
    test_pending_api()
