from django.contrib import admin
from .models import UserProfile, Community, CommunityMembership

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'created_at')
    list_filter = ('user_type',)
    search_fields = ('user__username', 'user__email')

class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'community_type', 'admin', 'created_at')
    list_filter = ('community_type', 'complaints_enabled', 'notices_enabled', 'events_enabled')
    search_fields = ('name', 'description', 'location')
    date_hierarchy = 'created_at'

class CommunityMembershipAdmin(admin.ModelAdmin):
    list_display = ('community', 'member', 'status', 'joined_at', 'approved_at')
    list_filter = ('status',)
    search_fields = ('community__name', 'member__user__username')
    date_hierarchy = 'joined_at'

admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Community, CommunityAdmin)
admin.site.register(CommunityMembership, CommunityMembershipAdmin)