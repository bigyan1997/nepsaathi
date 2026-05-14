from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html, mark_safe
from .models import Listing, ListingImage, SavedListing, ListingReport, ListingView


class ListingImageInline(admin.TabularInline):
    """
    Shows images directly inside the listing admin page.
    So you can add/remove images without leaving the listing.
    """
    model = ListingImage
    extra = 1
    fields = ('image', 'is_primary', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    """
    Admin configuration for the base Listing model.
    """
    inlines = [ListingImageInline]

    list_display = (
        'title',
        'listing_type',
        'user',
        'location',
        'state',
        'status',
        'review_badge',
        'is_featured',
        'created_at',
    )
    list_filter = (
        'listing_type',
        'status',
        'state',
        'is_featured',
        'is_under_review',
    )
    search_fields = (
        'title',
        'description',
        'location',
        'user__email',
    )
    ordering = ('-is_under_review', '-created_at')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'listing_type', 'title', 'description')
        }),
        ('Location', {
            'fields': ('location', 'state')
        }),
        ('Contact', {
            'fields': ('contact_email', 'contact_phone', 'contact_whatsapp')
        }),
        ('Status', {
            'fields': ('status', 'is_featured', 'is_under_review', 'renewal_blocked', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['approve_listings', 'mark_featured', 'unmark_featured']

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('reports')

    def save_model(self, request, obj, form, change):
        if change and 'is_under_review' in form.changed_data and not obj.is_under_review:
            obj.reports.filter(is_reviewed=False).update(is_reviewed=True)
        super().save_model(request, obj, form, change)

    def review_badge(self, obj):
        badges = []
        if obj.is_under_review:
            badges.append(
                '<span style="background:#A32D2D;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;'
                'display:inline-block;margin-bottom:2px;">&#9888; Spam</span>'
            )
        if obj.reports.exists():
            badges.append(
                '<span style="background:#B45309;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;'
                'display:inline-block;">&#128681; Reported</span>'
            )
        if badges:
            return mark_safe('<br>'.join(badges))
        return mark_safe('<span style="color:#aaa;font-size:11px;">&mdash;</span>')
    review_badge.short_description = 'Flags'

    def approve_listings(self, request, queryset):
        to_approve = queryset.filter(is_under_review=True)
        listing_ids = list(to_approve.values_list('id', flat=True))
        updated = to_approve.update(is_under_review=False)
        if listing_ids:
            ListingReport.objects.filter(listing_id__in=listing_ids, is_reviewed=False).update(is_reviewed=True)
        self.message_user(request, f'{updated} listing(s) approved and made public.')
    approve_listings.short_description = '✅ Approve — make listing public'

    def mark_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f'{queryset.count()} listings marked as featured.')
    mark_featured.short_description = '⭐ Mark as featured'

    def unmark_featured(self, request, queryset):
        queryset.update(is_featured=False)
        self.message_user(request, f'{queryset.count()} listings removed from featured.')
    unmark_featured.short_description = '✖ Remove from featured'

    


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    """
    Admin for listing images.
    """
    list_display = ('listing', 'is_primary', 'uploaded_at')
    list_filter = ('is_primary',)

@admin.register(ListingReport)
class ListingReportAdmin(admin.ModelAdmin):
    list_display = (
        'listing_title',
        'reason',
        'reported_by',
        'details_preview',
        'is_reviewed',
        'created_at',
        'delete_listing_button',
    )
    list_filter = ('reason', 'is_reviewed', 'created_at')
    search_fields = ('listing__title', 'user__email', 'details')
    ordering = ('-created_at',)
    readonly_fields = ('user', 'listing', 'reason', 'details', 'created_at', 'listing_info')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('listing', 'listing__user', 'user')

    fieldsets = (
        ('Report Details', {
            'fields': ('user', 'reason', 'details', 'created_at')
        }),
        ('Listing Information', {
            'fields': ('listing_info',)
        }),
        ('Status', {
            'fields': ('is_reviewed',)
        }),
    )

    def listing_title(self, obj):
        return obj.listing.title
    listing_title.short_description = 'Listing'

    def reported_by(self, obj):
        return obj.user.email
    reported_by.short_description = 'Reported by'

    def details_preview(self, obj):
        if obj.details:
            return obj.details[:60] + '...' if len(obj.details) > 60 else obj.details
        return '—'
    details_preview.short_description = 'Details'

    def listing_info(self, obj):
        listing = obj.listing
        return format_html(
            '<strong>Title:</strong> {}<br>'
            '<strong>Type:</strong> {}<br>'
            '<strong>Location:</strong> {}, {}<br>'
            '<strong>Posted by:</strong> {}<br>'
            '<strong>Status:</strong> {}<br>'
            '<strong>Created:</strong> {}',
            listing.title,
            listing.listing_type,
            listing.location,
            listing.state,
            listing.user.email,
            listing.status,
            listing.created_at.strftime('%d %b %Y %H:%M'),
        )
    listing_info.short_description = 'Listing Details'

    def delete_listing_button(self, obj):
        if obj.listing.status != 'deleted':
            url = reverse('admin:listings_listing_delete', args=[obj.listing.id])
            return format_html(
                '<a href="{}" '
                'style="background:#A32D2D;color:#fff;padding:4px 10px;'
                'border-radius:4px;text-decoration:none;font-size:11px;">'
                '🗑 Delete listing</a>',
                url
            )
        return format_html(
            '<span style="color:#888;font-size:11px;">Already deleted</span>'
        )
    delete_listing_button.short_description = 'Action'

    actions = ['mark_reviewed', 'clear_listing', 'remove_listing']

    def mark_reviewed(self, request, queryset):
        for report in queryset:
            report.is_reviewed = True
            report.save()
            report.listing.is_under_review = False
            report.listing.save()
        self.message_user(request, f'{queryset.count()} reports marked as reviewed.')
    mark_reviewed.short_description = '✅ Mark as reviewed'

    def clear_listing(self, request, queryset):
        from core.emails import send_listing_cleared_email
        for report in queryset:
            report.is_reviewed = True
            report.save()
            # Clear under review flag
            report.listing.is_under_review = False
            report.listing.save()
            send_listing_cleared_email(report)
        self.message_user(request, f'{queryset.count()} listings cleared — owners notified.')
    clear_listing.short_description = '✅ Clear listing — notify owner'

    def remove_listing(self, request, queryset):
        from core.emails import send_listing_removed_email
        for report in queryset:
                listing = report.listing
                owner = listing.user
                reason = f'Your listing violated our community guidelines: {report.get_reason_display()}'
                for image in listing.images.all():
                    image.delete()
                listing.status = 'deleted'
                listing.is_under_review = False
                listing.save()
                report.is_reviewed = True
                report.save()
                send_listing_removed_email(report, reason)

                # Check if user should be banned (3 removals)
                # Only count admin-removed listings, not user self-deletes
            # We track this by checking reports that were reviewed and removed
                
                removed_count = ListingReport.objects.filter(
                    listing__user=owner,
                    is_reviewed=True,
                    listing__status='deleted'
                ).values('listing').distinct().count()
                if removed_count >= 3 and not owner.is_banned:
                    owner.is_banned = True
                    owner.ban_reason = 'Multiple listing violations'
                    owner.save()
                    self.message_user(
                        request,
                        f'⚠️ User {owner.email} has been banned after {removed_count} violations.',
                        level='WARNING'
                    )

        self.message_user(request, f'{queryset.count()} listings removed — owners notified.')
    remove_listing.short_description = '❌ Remove listing — notify owner'


@admin.register(SavedListing)
class SavedListingAdmin(admin.ModelAdmin):
    list_display = ('user', 'listing', 'saved_at')
    search_fields = ('user__email', 'listing__title')
    readonly_fields = ('user', 'listing', 'saved_at')
    ordering = ('-saved_at',)


@admin.register(ListingView)
class ListingViewAdmin(admin.ModelAdmin):
    list_display = ('listing', 'user', 'ip_address', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('listing__title', 'user__email', 'ip_address')
    readonly_fields = ('listing', 'user', 'ip_address', 'viewed_at')
    ordering = ('-viewed_at',)