from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """
    Admin configuration for Job listings.
    """
    list_display = (
        'listing',
        'company_name',
        'job_type',
        'salary_display',
        'is_urgent',
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

    fieldsets = (
        ('Job Details', {
            'fields': ('listing', 'company_name', 'job_type', 'is_urgent')
        }),
        ('Salary', {
            'fields': ('salary', 'salary_type')
        }),
        ('Requirements', {
            'fields': ('experience_required', 'qualifications')
        }),
    )