from django.contrib import admin
from .models import Poll, PollVote

@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
  list_display = ('question', 'community', 'created_by', 'poll_type', 'is_active', 'end_date', 'created_at')
  list_filter = ('poll_type', 'is_active', 'community')
  search_fields = ('question', 'description')
  date_hierarchy = 'created_at'

@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
  list_display = ('poll', 'voter', 'choice', 'created_at')
  list_filter = ('choice',)
  search_fields = ('poll__question', 'voter__user__username')
  date_hierarchy = 'created_at' 