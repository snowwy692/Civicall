from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, ComplaintCategoryViewSet

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'complaint-categories', ComplaintCategoryViewSet, basename='complaint-category')

urlpatterns = [
    path('', include(router.urls)),
] 