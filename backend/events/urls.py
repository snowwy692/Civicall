from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventRSVPViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'event-rsvps', EventRSVPViewSet, basename='event-rsvp')

urlpatterns = [
    path('', include(router.urls)),
] 