#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicall.settings')
django.setup()

from communities.models import Community, CommunityMembership, UserProfile
from django.contrib.auth.models import User

def test_application_system():
    print("=== Testing Application System ===")
    
    # Check all communities
    communities = Community.objects.all()
    print(f"Total communities: {communities.count()}")
    
    # Check private communities
    private_communities = Community.objects.filter(community_type='private')
    print(f"Private communities: {private_communities.count()}")
    
    for community in private_communities:
        print(f"\n--- {community.name} (Private) ---")
        print(f"Admin: {community.admin.user.username}")
        
        # Check all memberships for this community
        memberships = CommunityMembership.objects.filter(community=community)
        print(f"Total memberships: {memberships.count()}")
        
        for membership in memberships:
            print(f"  - {membership.member.user.username}: {membership.status}")
        
        # Check pending applications specifically
        pending = CommunityMembership.objects.filter(community=community, status='pending')
        print(f"Pending applications: {pending.count()}")
        
        # Check approved members
        approved = CommunityMembership.objects.filter(community=community, status='approved')
        print(f"Approved members: {approved.count()}")
    
    # Check if there are any users who could apply
    users = User.objects.all()
    print(f"\nTotal users: {users.count()}")
    
    # Check if there are any regular members (non-managers)
    regular_users = UserProfile.objects.filter(user_type='member')
    print(f"Regular members: {regular_users.count()}")
    
    for user_profile in regular_users:
        print(f"  - {user_profile.user.username} ({user_profile.user_type})")
    
    # Test creating a test application
    print("\n=== Testing Application Creation ===")
    
    # Get a private community
    if private_communities.exists():
        test_community = private_communities.first()
        print(f"Testing with community: {test_community.name}")
        
        # Get a regular user
        if regular_users.exists():
            test_user = regular_users.first()
            print(f"Testing with user: {test_user.user.username}")
            
            # Check if user already has a membership
            existing_membership = CommunityMembership.objects.filter(
                community=test_community,
                member=test_user
            ).first()
            
            if existing_membership:
                print(f"User already has membership: {existing_membership.status}")
            else:
                print("User has no membership - can apply")
                
                # Create a test application
                test_membership = CommunityMembership.objects.create(
                    community=test_community,
                    member=test_user,
                    status='pending'
                )
                print(f"Created test application: {test_membership}")
                
                # Check pending applications again
                pending = CommunityMembership.objects.filter(community=test_community, status='pending')
                print(f"Pending applications after test: {pending.count()}")
        else:
            print("No regular users found to test with")
    else:
        print("No private communities found to test with")

if __name__ == '__main__':
    test_application_system()
