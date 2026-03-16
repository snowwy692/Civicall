from django.contrib import admin
from .models import Complaint, ComplaintCategory

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'community', 'category', 'priority', 'status', 'submitted_by', 'created_at')
    list_filter = ('community', 'category', 'priority', 'status')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'

@admin.register(ComplaintCategory)
class ComplaintCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'community', 'created_at')
    list_filter = ('community',)
    search_fields = ('name',)
    date_hierarchy = 'created_at'
