from django.contrib import admin
from .models import VisaTimeline, WhatsAppGroup, Occupation, InvitationRound, OccupationInvitation


@admin.register(VisaTimeline)
class VisaTimelineAdmin(admin.ModelAdmin):
    list_display = ('visa_type', 'lodged_month', 'granted_month', 'state_lodged', 'occupation', 'is_granted', 'is_approved', 'created_at')
    list_filter = ('visa_type', 'state_lodged', 'is_granted', 'is_approved')
    search_fields = ('occupation', 'anzsco_code', 'notes', 'user__email')
    list_editable = ('is_approved',)
    ordering = ('-created_at',)
    actions = ['approve_timelines', 'hide_timelines']

    @admin.action(description='✅ Approve selected timelines')
    def approve_timelines(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} timeline(s) approved.')

    @admin.action(description='🚫 Hide selected timelines')
    def hide_timelines(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} timeline(s) hidden.')


@admin.register(WhatsAppGroup)
class WhatsAppGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'category', 'member_count', 'is_verified', 'is_active', 'order')
    list_filter = ('state', 'category', 'is_verified', 'is_active')
    search_fields = ('name', 'city', 'description')
    list_editable = ('is_verified', 'is_active', 'order')
    ordering = ('order', '-created_at')


class OccupationInvitationInline(admin.TabularInline):
    model = OccupationInvitation
    extra = 0
    fields = ('round_date', 'visa_type', 'score', 'was_invited', 'notes')
    ordering = ('-round_date', 'visa_type')


@admin.register(Occupation)
class OccupationAdmin(admin.ModelAdmin):
    list_display = ('anzsco_code', 'title', 'list_type', 'eligible_visas', 'last_updated')
    list_filter = ('list_type',)
    search_fields = ('anzsco_code', 'title', 'alternative_titles')
    list_editable = ('list_type', 'eligible_visas')
    ordering = ('anzsco_code',)
    inlines = [OccupationInvitationInline]


@admin.register(OccupationInvitation)
class OccupationInvitationAdmin(admin.ModelAdmin):
    list_display = ('occupation', 'round_date', 'visa_type', 'score', 'was_invited', 'notes')
    list_filter = ('visa_type', 'was_invited', 'round_date')
    search_fields = ('occupation__anzsco_code', 'occupation__title', 'round_date')
    ordering = ('-round_date', 'visa_type', 'occupation__anzsco_code')


@admin.register(InvitationRound)
class InvitationRoundAdmin(admin.ModelAdmin):
    list_display = ('round_date', 'visa_type', 'lowest_score', 'invitations_issued', 'tiebreaker_date')
    list_filter = ('visa_type',)
    search_fields = ('round_date',)
    ordering = ('-round_date', 'visa_type')
