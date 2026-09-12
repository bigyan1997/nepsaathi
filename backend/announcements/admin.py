from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(ModelAdmin):
    list_display = (
        'listing',
        'category',
        'price_display',
        'condition',
        'is_free',
        'is_urgent',
        'images_link',
    )
    list_filter = (
        'category',
        'condition',
        'is_free',
        'is_urgent',
    )
    search_fields = (
        'listing__title',
        'listing__location',
        'listing__user__email',
    )
    readonly_fields = ('images_link',)

    fieldsets = (
        ('Announcement Details', {
            'fields': ('listing', 'category', 'is_urgent'),
            'classes': ['tab'],
        }),
        ('Pricing', {
            'fields': ('price', 'is_free', 'condition'),
            'classes': ['tab'],
        }),
        ('Images', {
            'fields': ('images_link',),
            'classes': ['tab'],
        }),
    )

    def images_link(self, obj):
        if not obj.pk:
            return '—'
        url = reverse('admin:listings_listing_change', args=[obj.listing_id])
        count = obj.listing.images.count()
        label = f'{count} image{"s" if count != 1 else ""} — click to manage'
        return format_html(
            '<a href="{}" style="background:#534AB7;color:#fff;padding:6px 14px;'
            'border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">'
            '🖼 {}</a>',
            url, label,
        )
    images_link.short_description = 'Images'