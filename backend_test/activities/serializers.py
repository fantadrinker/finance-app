
from activities.models import User, Activity, DescriptionToCategoryMapping
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_name']

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['user', 'account_type', 'date', 'descriptions', 'amount']
    
    def create(self, validated_data):
        return Activity.objects.create(**validated_data)

class DescriptionToCategoryMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DescriptionToCategoryMapping
        fields = ['description', 'category']

