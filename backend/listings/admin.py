from django.contrib import admin
from .models import Listing, ListingImage


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


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    """
    Admin for listing images.
    """
    list_display = ('listing', 'is_primary', 'uploaded_at')
    list_filter = ('is_primary',)