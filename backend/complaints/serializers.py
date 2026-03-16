from rest_framework import serializers
from .models import Complaint, ComplaintCategory
from communities.serializers import UserProfileSerializer, CommunitySerializer

class ComplaintCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintCategory
        fields = ['id', 'name', 'description', 'community', 'created_at']
        read_only_fields = ['created_at']

class ComplaintSerializer(serializers.ModelSerializer):
    category = ComplaintCategorySerializer(read_only=True)
    community = CommunitySerializer(read_only=True)
    submitted_by = UserProfileSerializer(read_only=True)
    resolved_by = UserProfileSerializer(read_only=True)
    is_duplicate = serializers.ReadOnlyField()
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'title', 'description', 'category', 'community', 'submitted_by',
            'priority', 'status', 'image', 'admin_remarks', 'resolved_at', 'resolved_by',
            'created_at', 'updated_at', 'is_duplicate'
        ]
        read_only_fields = ['created_at', 'updated_at', 'resolved_at', 'resolved_by']

class ComplaintCreateSerializer(serializers.ModelSerializer):
    category = serializers.CharField(max_length=100)  # Accept string category name
    
    class Meta:
        model = Complaint
        fields = ['title', 'description', 'category', 'community', 'priority', 'image']
    
    def create(self, validated_data):
        category_name = validated_data.pop('category')
        community = validated_data['community']
        
        # Get or create the category for this specific community
        category, created = ComplaintCategory.objects.get_or_create(
            name=category_name,
            community=community,
            defaults={'description': f'Category for {category_name} complaints'}
        )
        
        validated_data['category'] = category
        return super().create(validated_data)


# Perfect update serializer for complaints
class ComplaintUpdateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(choices=Complaint.PRIORITY_CHOICES, required=False)
    
    class Meta:
        model = Complaint
        fields = [
            'title', 'description', 'priority'
        ]

    def validate(self, data):
        """
        Custom validation to ensure data integrity
        """
        # Ensure title is not empty if provided
        if 'title' in data and not data['title'].strip():
            raise serializers.ValidationError("Title cannot be empty")
        
        # Ensure description is not empty if provided
        if 'description' in data and not data['description'].strip():
            raise serializers.ValidationError("Description cannot be empty")
        
        # Validate priority choices if provided
        if 'priority' in data:
            valid_priorities = ['normal', 'urgent', 'critical']
            if data['priority'] not in valid_priorities:
                raise serializers.ValidationError(f"Priority must be one of: {valid_priorities}")
        
        return data

    def update(self, instance, validated_data):
        """
        Custom update method to handle partial updates properly
        """
        # Only update fields that are provided
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        return instance

class ComplaintFilterSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.STATUS_CHOICES, required=False)
    priority = serializers.ChoiceField(choices=Complaint.PRIORITY_CHOICES, required=False)
    category = serializers.IntegerField(required=False)
    community = serializers.IntegerField(required=False) 