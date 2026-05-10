from rest_framework import serializers
from .models import FeedbackResponse, REASON_CHOICES


class FeedbackSerializer(serializers.ModelSerializer):
    reason = serializers.ChoiceField(choices=[r[0] for r in REASON_CHOICES])

    class Meta:
        model = FeedbackResponse
        fields = ('satisfaction', 'reason', 'page_url')

    def validate_satisfaction(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Satisfaction must be between 1 and 5.")
        return value
