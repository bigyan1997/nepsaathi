from django.db.models import Avg, Min, Max, Count, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.authentication import SilentJWTAuthentication
from .models import VisaTimeline, WhatsAppGroup, Occupation, InvitationRound, OccupationInvitation
from .serializers import (
    VisaTimelineSerializer, WhatsAppGroupSerializer,
    OccupationSerializer, InvitationRoundSerializer,
)


class VisaTimelineListCreateView(generics.ListCreateAPIView):
    serializer_class = VisaTimelineSerializer
    authentication_classes = [SilentJWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = VisaTimeline.objects.filter(is_approved=True)
        if visa_type := self.request.query_params.get('visa_type'):
            qs = qs.filter(visa_type=visa_type)
        if state := self.request.query_params.get('state'):
            qs = qs.filter(state_lodged=state)
        if year := self.request.query_params.get('year'):
            qs = qs.filter(lodged_month__startswith=str(year))
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VisaTimelineDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VisaTimelineSerializer
    authentication_classes = [SilentJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VisaTimeline.objects.filter(user=self.request.user)


class VisaTimelineStatsView(APIView):
    authentication_classes = [SilentJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        visa_type = request.query_params.get('visa_type')
        state = request.query_params.get('state')

        qs = VisaTimeline.objects.filter(is_approved=True)
        if visa_type:
            qs = qs.filter(visa_type=visa_type)
        if state:
            qs = qs.filter(state_lodged=state)

        total = qs.count()
        granted = qs.filter(is_granted=True)
        still_waiting = qs.filter(is_granted=False).count()

        # Compute wait months in Python (avoid DB-level date arithmetic on char fields)
        waits = []
        for t in granted.values('lodged_month', 'granted_month'):
            try:
                ly, lm = map(int, t['lodged_month'].split('-'))
                gy, gm = map(int, t['granted_month'].split('-'))
                waits.append((gy - ly) * 12 + (gm - lm))
            except Exception:
                pass

        stats = {
            'total_submissions': total,
            'granted_count': len(waits),
            'still_waiting': still_waiting,
            'median_wait_months': sorted(waits)[len(waits) // 2] if waits else None,
            'min_wait_months': min(waits) if waits else None,
            'max_wait_months': max(waits) if waits else None,
        }
        return Response(stats)


class WhatsAppGroupListView(generics.ListAPIView):
    serializer_class = WhatsAppGroupSerializer
    authentication_classes = [SilentJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = WhatsAppGroup.objects.filter(is_active=True)
        if state := self.request.query_params.get('state'):
            qs = qs.filter(state=state)
        if category := self.request.query_params.get('category'):
            qs = qs.filter(category=category)
        return qs


class OccupationListView(generics.ListAPIView):
    serializer_class = OccupationSerializer
    authentication_classes = [SilentJWTAuthentication]
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Occupation.objects.prefetch_related('invitations').all()
        if q := self.request.query_params.get('q'):
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(anzsco_code__icontains=q) |
                Q(alternative_titles__icontains=q)
            )
        if list_type := self.request.query_params.get('list_type'):
            qs = qs.filter(list_type=list_type)
        return qs


class InvitationRoundListView(generics.ListAPIView):
    serializer_class = InvitationRoundSerializer
    authentication_classes = [SilentJWTAuthentication]
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = InvitationRound.objects.all()
        if visa_type := self.request.query_params.get('visa_type'):
            qs = qs.filter(visa_type=visa_type)
        return qs
