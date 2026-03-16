from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vehicle
from .serializers import VehicleSerializer, VehicleCreateSerializer
from communities.models import CommunityMembership

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['community', 'vehicle_type']
    search_fields = ['model', 'registration_number']
    ordering_fields = ['created_at', 'vehicle_type']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return VehicleCreateSerializer
        return VehicleSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.is_manager:
            # Managers can see vehicles for communities they manage
            return Vehicle.objects.filter(community__admin=user.profile)
        else:
            # Members can see vehicles for communities they're part of
            return Vehicle.objects.filter(
                community__members=user.profile,
                community__communitymembership__status='approved'
            )
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user.profile) 