from django.contrib import admin
from django.utils.html import format_html
from .models import Listing, ListingImage, SavedListing, ListingReport


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
        'is_featured',
        'created_at'
    )
    list_filter = (
        'listing_type',
        'status',
        'state',
        'is_featured',
    )
    search_fields = (
        'title',
        'description',
        'location',
        'user__email',
    )
    ordering = ('-created_at',)
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
            'fields': ('status', 'is_featured', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['mark_featured', 'unmark_featured']

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
            return format_html(
                '<a href="/admin/listings/listing/{}/delete/" '
                'style="background:#A32D2D;color:#fff;padding:4px 10px;'
                'border-radius:4px;text-decoration:none;font-size:11px;">'
                '🗑 Delete listing</a>',
                obj.listing.id
            )
        return format_html(
            '<span style="color:#888;font-size:11px;">Already deleted</span>'
        )
    delete_listing_button.short_description = 'Action'

    actions = ['mark_reviewed', 'clear_listing', 'remove_listing']

    def mark_reviewed(self, request, queryset):
        queryset.update(is_reviewed=True)
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
            reason = f'Your listing violated our community guidelines: {report.get_reason_display()}'
            for image in listing.images.all():
                image.delete()
            listing.status = 'deleted'
            listing.is_under_review = False
            listing.save()
            report.is_reviewed = True
            report.save()
            send_listing_removed_email(report, reason)
        self.message_user(request, f'{queryset.count()} listings removed — owners notified.')
    remove_listing.short_description = '❌ Remove listing — notify owner'

    def delete_reported_listings(self, request, queryset):
        count = 0
        for report in queryset:
            if report.listing.status != 'deleted':
                for image in report.listing.images.all():
                    image.delete()
                report.listing.status = 'deleted'
                report.listing.save()
                report.is_reviewed = True
                report.save()
                count += 1
        self.message_user(request, f'{count} listings deleted successfully.')
    delete_reported_listings.short_description = '🗑 Delete reported listings'