from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Job


@admin.register(Job)
class JobAdmin(ModelAdmin):
    list_display = (
        'listing',
        'company_name',
        'job_type',
        'salary_display',
        'is_urgent',
        'images_link',
    )
    list_filter = (
        'job_type',
        'salary_type',
        'is_urgent',
    )
    search_fields = (
        'listing__title',
        'company_name',
        'listing__location',
    )
    readonly_fields = ('images_link',)

    fieldsets = (
        ('Job Details', {
            'fields': ('listing', 'company_name', 'job_type', 'is_urgent'),
            'classes': ['tab'],
        }),
        ('Salary', {
            'fields': ('salary', 'salary_type'),
            'classes': ['tab'],
        }),
        ('Requirements', {
            'fields': ('experience_required', 'qualifications'),
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
            '<a href="{}#images-tab" style="background:#534AB7;color:#fff;padding:6px 14px;'
            'border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">'
            '🖼 {}</a>',
            url, label,
        )
    images_link.short_description = 'Images'

