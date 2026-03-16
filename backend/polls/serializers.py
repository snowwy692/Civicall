from rest_framework import serializers
from .models import Poll, PollVote
from communities.serializers import UserProfileSerializer, CommunitySerializer
from datetime import datetime, timezone

class PollSerializer(serializers.ModelSerializer):
    created_by = UserProfileSerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Poll
        fields = [
            'id', 'question', 'description', 'community', 'created_by', 'poll_type',
            'options', 'is_active', 'end_date', 'vote_count', 'user_vote',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_vote_count(self, obj):
        return obj.votes.count()
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = obj.votes.get(voter=request.user.profile)
                return vote.choice
            except PollVote.DoesNotExist:
                return None
        return None

class PollCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poll
        fields = ['question', 'description', 'community', 'poll_type', 'options', 'end_date']
    
    def validate(self, data):
        question = (data.get('question') or '').strip()
        if not question:
            raise serializers.ValidationError('Question cannot be empty')
        poll_type = data.get('poll_type')
        if poll_type not in ['yes_no', 'multiple_choice']:
            raise serializers.ValidationError('Invalid poll type')
        options = data.get('options') or []
        if poll_type == 'multiple_choice':
            if not isinstance(options, list):
                raise serializers.ValidationError('Options must be a list for multiple choice polls')
            clean = [str(o).strip() for o in options if str(o).strip()]
            if len(clean) < 2:
                raise serializers.ValidationError('Provide at least 2 options for multiple choice polls')
            data['options'] = clean
        else:
            data['options'] = []
        community = data.get('community')
        if not community:
            raise serializers.ValidationError('Community is required')
        end_date = data.get('end_date')
        if not end_date:
            raise serializers.ValidationError('End date is required')
        # Ensure end_date is in the future
        now = datetime.now(timezone.utc)
        if end_date <= now:
            raise serializers.ValidationError('End date must be in the future')
        return data

class PollVoteSerializer(serializers.ModelSerializer):
    voter = UserProfileSerializer(read_only=True)
    poll = PollSerializer(read_only=True)
    
    class Meta:
        model = PollVote
        fields = ['id', 'poll', 'voter', 'choice', 'created_at']
        read_only_fields = ['created_at']

class PollVoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ['choice'] 