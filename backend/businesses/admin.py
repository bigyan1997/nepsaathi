from django.contrib import admin
from .models import Business, BusinessReport, BusinessReview


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

    actions = ['verify_businesses', 'unverify_businesses', 'remove_businesses']

    def save_model(self, request, obj, form, change):
        if change:
            old = Business.objects.get(pk=obj.pk)
            was_verified = old.is_verified
            was_active = old.is_active
        super().save_model(request, obj, form, change)
        if not change:
            return
        try:
            from core.emails import send_business_verified_email, send_business_removed_email
            if not was_verified and obj.is_verified:
                send_business_verified_email(obj)
            if was_active and not obj.is_active:
                send_business_removed_email(obj)
        except Exception as e:
            print(f'Business admin email failed: {e}', flush=True)

    def verify_businesses(self, request, queryset):
        unverified = list(queryset.filter(is_verified=False))
        queryset.update(is_verified=True)
        try:
            from core.emails import send_business_verified_email
            for business in unverified:
                send_business_verified_email(business)
        except Exception as e:
            print(f'Business verified email failed: {e}', flush=True)
        self.message_user(request, f'{queryset.count()} businesses verified.')
    verify_businesses.short_description = 'Verify selected businesses'

    def unverify_businesses(self, request, queryset):
        queryset.update(is_verified=False)
        self.message_user(request, f'{queryset.count()} businesses unverified.')
    unverify_businesses.short_description = 'Unverify selected businesses'

    def remove_businesses(self, request, queryset):
        businesses = list(queryset.filter(is_active=True))
        queryset.update(is_active=False)
        try:
            from core.emails import send_business_removed_email
            for business in businesses:
                send_business_removed_email(business)
        except Exception as e:
            print(f'Business removed email failed: {e}', flush=True)
        self.message_user(request, f'{len(businesses)} businesses removed.')
    remove_businesses.short_description = 'Remove selected businesses'


@admin.register(BusinessReport)
class BusinessReportAdmin(admin.ModelAdmin):
    list_display = ('business', 'user', 'reason', 'is_reviewed', 'created_at')
    list_filter = ('reason', 'is_reviewed')
    search_fields = ('business__business_name', 'user__email')
    readonly_fields = ('user', 'business', 'reason', 'details', 'created_at')
    ordering = ('-created_at',)
    actions = ['clear_reports', 'remove_reported_businesses']

    def clear_reports(self, request, queryset):
        queryset.update(is_reviewed=True)
        try:
            from core.emails import send_business_cleared_email
            for report in queryset:
                send_business_cleared_email(report)
        except Exception as e:
            print(f'Business cleared email failed: {e}', flush=True)
        self.message_user(request, f'{queryset.count()} reports cleared — owners notified.')
    clear_reports.short_description = 'Clear selected reports (notify owner: no action taken)'

    def remove_reported_businesses(self, request, queryset):
        businesses = []
        for report in queryset:
            business = report.business
            if business.is_active:
                business.is_active = False
                business.save()
                businesses.append((business, report.get_reason_display()))
        queryset.update(is_reviewed=True)
        try:
            from core.emails import send_business_removed_email
            for business, reason in businesses:
                send_business_removed_email(business, reason)
        except Exception as e:
            print(f'Business removed email failed: {e}', flush=True)
        self.message_user(request, f'{len(businesses)} businesses removed — owners notified.')
    remove_reported_businesses.short_description = 'Remove reported businesses (notify owner)'


@admin.register(BusinessReview)
class BusinessReviewAdmin(admin.ModelAdmin):
    list_display = ('business', 'reviewer', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('business__business_name', 'reviewer__email', 'comment')
    readonly_fields = ('business', 'reviewer', 'rating', 'comment', 'created_at')
    ordering = ('-created_at',)