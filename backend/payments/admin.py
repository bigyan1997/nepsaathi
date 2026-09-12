from django.contrib import admin
from unfold.admin import ModelAdmin
from django.http import HttpResponse
from django.utils.html import format_html
from .models import FeaturedPayment
from .pdf import generate_invoice_pdf


@admin.register(FeaturedPayment)
class FeaturedPaymentAdmin(ModelAdmin):
    list_display = ('id', 'listing', 'user', 'amount_display', 'duration_days', 'status_badge', 'created_at', 'invoice_link')
    list_filter = ('status',)
    search_fields = ('listing__title', 'user__email', 'stripe_session_id')
    date_hierarchy = 'created_at'
    show_full_result_count = False
    readonly_fields = ('stripe_session_id', 'amount_paid', 'created_at', 'completed_at')

    _STATUS_COLORS = {
        'completed': ('#166534', '#dcfce7'),
        'pending':   ('#92400e', '#fef3c7'),
        'failed':    ('#991b1b', '#fee2e2'),
    }

    def status_badge(self, obj):
        from django.utils.html import format_html
        fg, bg = self._STATUS_COLORS.get(obj.status, ('#374151', '#f3f4f6'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;border-radius:20px;'
            'font-size:11px;font-weight:600;white-space:nowrap;">{}</span>',
            bg, fg, obj.status.title(),
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def amount_display(self, obj):
        return f'${obj.amount_paid / 100:.2f} AUD'
    amount_display.short_description = 'Amount'

    def invoice_link(self, obj):
        if obj.status != 'completed':
            return '-'
        from django.urls import reverse
        url = reverse('admin:payment-invoice', args=[obj.pk])
        return format_html('<a href="{}" target="_blank">Download PDF</a>', url)
    invoice_link.short_description = 'Invoice'

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom = [
            path('<int:pk>/invoice/', self.admin_site.admin_view(self.download_invoice), name='payment-invoice'),
        ]
        return custom + urls

    def download_invoice(self, request, pk):
        payment = FeaturedPayment.objects.get(pk=pk)
        pdf_bytes = generate_invoice_pdf(payment)
        invoice_num = f"INV-{payment.id:05d}"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="NepSaathi-{invoice_num}.pdf"'
        return response
