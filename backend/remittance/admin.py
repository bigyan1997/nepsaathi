from django.contrib import admin
from .models import RemittanceRate


@admin.register(RemittanceRate)
class RemittanceRateAdmin(admin.ModelAdmin):
    list_display = ['provider', 'rate', 'fee_aud', 'fetched_at']
    readonly_fields = ['fetched_at']
