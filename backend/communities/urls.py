from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_auth import register

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='profile')
router.register(r'communities', views.CommunityViewSet, basename='community')
router.register(r'memberships', views.CommunityMembershipViewSet, basename='membership')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'audit-logs', views.AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('profiles/me/', views.my_profile, name='my_profile'),
    path('auth/register/', register, name='register'),
    path('promote-to-manager/', views.promote_to_manager, name='promote_to_manager'),
    path('', include(router.urls)),
] 