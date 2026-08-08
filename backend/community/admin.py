from django.contrib import admin
from .models import ReverseRequest, ServiceListing


@admin.register(ReverseRequest)
class ReverseRequestAdmin(admin.ModelAdmin):
    list_display  = ['title', 'user', 'category', 'state', 'is_active', 'created_at']
    list_filter   = ['category', 'is_active', 'state']
    search_fields = ['title', 'user__email']
    actions       = ['deactivate']

    def deactivate(self, request, queryset):
        queryset.update(is_active=False)
    deactivate.short_description = 'Deactivate selected requests'


@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display  = ['title', 'user', 'category', 'state', 'is_active', 'created_at']
    list_filter   = ['category', 'is_active', 'state']
    search_fields = ['title', 'user__email']
    actions       = ['deactivate']

    def deactivate(self, request, queryset):
        queryset.update(is_active=False)
    deactivate.short_description = 'Deactivate selected listings'
