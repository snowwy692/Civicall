from django.contrib import admin
from .models import Notice

@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ['title', 'community', 'is_pinned', 'posted_by', 'created_at']
    list_filter = ['is_pinned', 'created_at', 'community', 'posted_by']
    search_fields = ['title', 'message']
    date_hierarchy = 'created_at'
    list_editable = ['is_pinned']
    
    fieldsets = (
        ('Notice Information', {
            'fields': ('title', 'message', 'image', 'attachment')
        }),
        ('Community & Status', {
            'fields': ('community', 'is_pinned', 'posted_by')
        }),
    )
