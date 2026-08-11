from rest_framework import serializers
from .models import VisaTimeline, WhatsAppGroup, Occupation, InvitationRound


class VisaTimelineSerializer(serializers.ModelSerializer):
    submitter = serializers.SerializerMethodField()
    wait_months = serializers.SerializerMethodField()

    class Meta:
        model = VisaTimeline
        fields = [
            'id', 'visa_type', 'lodged_month', 'granted_month',
            'state_lodged', 'occupation', 'anzsco_code', 'notes',
            'is_granted', 'wait_months', 'submitter', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'submitter', 'wait_months']

    def get_submitter(self, obj):
        if obj.user:
            name = obj.user.get_full_name() or obj.user.email.split('@')[0]
            return name[:20]  # truncate for privacy
        return 'Anonymous'

    def get_wait_months(self, obj):
        if not obj.granted_month or not obj.lodged_month:
            return None
        try:
            from datetime import date
            ly, lm = map(int, obj.lodged_month.split('-'))
            gy, gm = map(int, obj.granted_month.split('-'))
            return (gy - ly) * 12 + (gm - lm)
        except Exception:
            return None


class WhatsAppGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppGroup
        fields = [
            'id', 'name', 'state', 'city', 'category',
            'link', 'member_count', 'description', 'is_verified',
        ]


class OccupationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Occupation
        fields = [
            'id', 'anzsco_code', 'title', 'list_type', 'eligible_visas',
            'alternative_titles', 'notes', 'last_updated',
        ]


class InvitationRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvitationRound
        fields = [
            'id', 'round_date', 'visa_type', 'lowest_score',
            'invitations_issued', 'tiebreaker_date',
        ]
