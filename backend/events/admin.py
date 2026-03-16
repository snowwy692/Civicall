from django.contrib import admin
from .models import Event, EventRSVP

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'community', 'date', 'time', 'venue', 'is_active', 'created_by']
    list_filter = ['is_active', 'date', 'community', 'created_by']
    search_fields = ['title', 'description', 'venue']
    date_hierarchy = 'date'
    list_editable = ['is_active']
    
    fieldsets = (
        ('Event Information', {
            'fields': ('title', 'description', 'venue')
        }),
        ('Schedule', {
            'fields': ('date', 'time')
        }),
        ('Community & Status', {
            'fields': ('community', 'is_active', 'created_by')
        }),
    )

@admin.register(EventRSVP)
class EventRSVPAdmin(admin.ModelAdmin):
    list_display = ['event', 'member', 'response', 'created_at']
    list_filter = ['response', 'created_at', 'event']
    search_fields = ['event__title', 'member__user__username']
    date_hierarchy = 'created_at'
