from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from communities.models import UserProfile

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    print(f"DEBUG: Registration data: {data}")
    
    if User.objects.filter(username=data.get('username')).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=data.get('email')).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password'),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )
        print(f"DEBUG: User created: {user.username}")
        
        profile = UserProfile.objects.create(
            user=user,
            user_type=data.get('user_type', 'member'),
            phone_number=data.get('phone_number', ''),
            address=data.get('address', '')
        )
        print(f"DEBUG: Profile created: {profile}")
        
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"DEBUG: Registration error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)