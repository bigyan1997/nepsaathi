from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html
from .models import FeaturedPayment
from .pdf import generate_invoice_pdf


@admin.register(FeaturedPayment)
class FeaturedPaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'user', 'amount_display', 'duration_days', 'status', 'created_at', 'invoice_link')
    list_filter = ('status',)
    search_fields = ('listing__title', 'user__email', 'stripe_session_id')
    readonly_fields = ('stripe_session_id', 'amount_paid', 'created_at', 'completed_at')

    def amount_display(self, obj):
        return f'${obj.amount_paid / 100:.2f} AUD'
    amount_display.short_description = 'Amount'

    def invoice_link(self, obj):
        if obj.status != 'completed':
            return '-'
        url = f'/admin/payments/featuredpayment/{obj.pk}/invoice/'
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
