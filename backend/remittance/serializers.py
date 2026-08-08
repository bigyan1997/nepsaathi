from rest_framework import serializers
from .models import RemittanceRate


class RemittanceRateSerializer(serializers.ModelSerializer):
    provider_label = serializers.CharField(source='get_provider_display', read_only=True)

    class Meta:
        model = RemittanceRate
        fields = ['provider', 'provider_label', 'rate', 'fee_aud', 'send_url', 'fetched_at']
