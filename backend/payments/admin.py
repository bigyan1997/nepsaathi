from django.contrib import admin
from .models import FeaturedPayment


@admin.register(FeaturedPayment)
class FeaturedPaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'user', 'amount_display', 'duration_days', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('listing__title', 'user__email', 'stripe_session_id')
    readonly_fields = ('stripe_session_id', 'amount_paid', 'created_at', 'completed_at')

    def amount_display(self, obj):
        return f'${obj.amount_paid / 100:.2f} AUD'
    amount_display.short_description = 'Amount'
