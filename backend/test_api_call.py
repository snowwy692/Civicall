#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicall.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User

from communities.models import Community, CommunityMembership, UserProfile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

def test_pending_api_call():
    print("=== Testing API Call for Pending Applications ===")
    
    # Get the moksheet community
    moksheet = Community.objects.get(name='moksheet')
    print(f"Community ID: {moksheet.id}")
    
    # Get alicej user (admin)
    alicej_user = User.objects.get(username='alicej')
    
    # Create API client and authenticate as alicej
    client = APIClient()
    refresh = RefreshToken.for_user(alicej_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    # Test the API call
    url = f'/api/communities/{moksheet.id}/pending_applications/'
    print(f"Testing URL: {url}")
    
    response = client.get(url)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
    
    if response.status_code == 200:
        pending_apps = response.data
        print(f"Pending applications count: {len(pending_apps)}")
        for app in pending_apps:
            print(f"  - {app}")
    else:
        print(f"Error: {response.data}")

if __name__ == '__main__':
    test_pending_api_call()
