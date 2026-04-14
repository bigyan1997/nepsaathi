from django.contrib import admin
from .models import Business


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    """
    Admin for Nepalese businesses.
    Admins can verify businesses from here.
    """
    list_display = (
        'business_name',
        'category',
        'suburb',
        'state',
        'is_nepalese_owned',
        'is_verified',
        'is_active',
        'owner',
        'created_at',
    )
    list_filter = (
        'category',
        'state',
        'is_nepalese_owned',
        'is_verified',
        'is_active',
    )
    search_fields = (
        'business_name',
        'suburb',
        'owner__email',
        'abn',
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Business Info', {
            'fields': (
                'owner',
                'business_name',
                'category',
                'description',
                'is_nepalese_owned',
            )
        }),
        ('Location', {
            'fields': ('address', 'suburb', 'state', 'postcode')
        }),
        ('Contact', {
            'fields': ('phone', 'whatsapp', 'email', 'website')
        }),
        ('Business Details', {
            'fields': ('abn', 'established_year', 'operating_hours')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['verify_businesses', 'unverify_businesses']

    def verify_businesses(self, request, queryset):
        """Bulk verify selected businesses."""
        queryset.update(is_verified=True)
        self.message_user(request, f'{queryset.count()} businesses verified.')
    verify_businesses.short_description = 'Verify selected businesses'

    def unverify_businesses(self, request, queryset):
        """Bulk unverify selected businesses."""
        queryset.update(is_verified=False)
        self.message_user(request, f'{queryset.count()} businesses unverified.')
    unverify_businesses.short_description = 'Unverify selected businesses'