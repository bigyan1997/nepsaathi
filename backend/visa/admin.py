from django.contrib import admin
from .models import VisaTimeline, WhatsAppGroup


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
