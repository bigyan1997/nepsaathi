import logging
import stripe
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from listings.models import Listing
from businesses.models import Business
from .models import FeaturedPayment
from .pdf import generate_invoice_pdf
from core.emails import send_payment_invoice_email

logger = logging.getLogger(__name__)


class PaymentStatusThrottle(UserRateThrottle):
    scope = 'payment_status'


class CreateCheckoutSessionView(APIView):
    """
    POST /api/payments/feature/<listing_id>/
    Creates a Stripe checkout session to feature a listing for 7 days.
    Owner only.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, listing_id):
        if getattr(request.user, 'is_banned', False):
            return Response({'detail': 'Your account has been suspended.'}, status=403)

        try:
            listing = Listing.objects.get(pk=listing_id, user=request.user, status='active')
        except Listing.DoesNotExist:
            raise NotFound('Active listing not found or not yours.')

        if listing.is_under_review:
            raise ValidationError(
                'This listing is under review and cannot be featured. '
                'Contact us at support@nepsaathi.com if you have questions.'
            )
        if listing.renewal_blocked:
            raise ValidationError('This listing cannot be featured at this time.')

        stripe.api_key = settings.STRIPE_SECRET_KEY
        frontend_url = settings.FRONTEND_URL

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'aud',
                    'unit_amount': settings.STRIPE_FEATURED_PRICE_CENTS,
                    'product_data': {
                        'name': f'Feature listing: {listing.title}',
                        'description': f'Your listing will appear at the top of search results for 7 days.',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&listing_id={listing.id}',
            cancel_url=f'{frontend_url}/payment/cancel',
            metadata={
                'listing_id': str(listing.id),
                'user_id': str(request.user.id),
                'duration_days': '7',
            },
            client_reference_id=str(listing.id),
        )

        # Lock the row to prevent concurrent requests creating duplicate pending payments
        with transaction.atomic():
            pending = FeaturedPayment.objects.select_for_update().filter(
                listing=listing,
                user=request.user,
                status='pending',
            ).first()
            if pending:
                pending.stripe_session_id = session.id
                pending.save(update_fields=['stripe_session_id'])
            else:
                FeaturedPayment.objects.create(
                    listing=listing,
                    user=request.user,
                    stripe_session_id=session.id,
                    amount_paid=settings.STRIPE_FEATURED_PRICE_CENTS,
                    duration_days=7,
                    status='pending',
                )

        return Response({'checkout_url': session.url})


class CreateBusinessCheckoutSessionView(APIView):
    """
    POST /api/payments/feature-business/<business_id>/
    Creates a Stripe checkout session to feature a business for 7 days.
    Owner only.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, business_id):
        if getattr(request.user, 'is_banned', False):
            return Response({'detail': 'Your account has been suspended.'}, status=403)

        try:
            business = Business.objects.get(pk=business_id, owner=request.user)
        except Business.DoesNotExist:
            raise NotFound('Business not found or not yours.')

        stripe.api_key = settings.STRIPE_SECRET_KEY
        frontend_url = settings.FRONTEND_URL

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'aud',
                    'unit_amount': settings.STRIPE_FEATURED_PRICE_CENTS,
                    'product_data': {
                        'name': f'Feature business: {business.name}',
                        'description': 'Your business will appear at the top of the directory for 7 days.',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{frontend_url}/payment/success?business_id={business.id}',
            cancel_url=f'{frontend_url}/payment/cancel',
            metadata={
                'business_id': str(business.id),
                'user_id': str(request.user.id),
                'duration_days': '7',
            },
        )

        with transaction.atomic():
            pending = FeaturedPayment.objects.select_for_update().filter(
                business=business,
                user=request.user,
                status='pending',
            ).first()
            if pending:
                pending.stripe_session_id = session.id
                pending.save(update_fields=['stripe_session_id'])
            else:
                FeaturedPayment.objects.create(
                    business=business,
                    user=request.user,
                    stripe_session_id=session.id,
                    amount_paid=settings.STRIPE_FEATURED_PRICE_CENTS,
                    duration_days=7,
                    status='pending',
                )

        return Response({'checkout_url': session.url})


class StripeWebhookView(APIView):
    """
    POST /api/payments/webhook/
    Handles Stripe webhook events. CSRF exempt — verified by signature instead.
    """
    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            logger.warning('Stripe webhook signature mismatch from %s', request.META.get('REMOTE_ADDR'))
            return Response({'error': 'Invalid signature'}, status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            self._handle_checkout_completed(session)

        return Response({'status': 'ok'})

    def _handle_checkout_completed(self, session):
        session_id = session['id']

        # Validate the amount matches our expected price before fulfilling
        amount_total = session['amount_total']
        if amount_total != settings.STRIPE_FEATURED_PRICE_CENTS:
            logger.error(
                'Stripe webhook amount mismatch: expected %s, got %s for session %s',
                settings.STRIPE_FEATURED_PRICE_CENTS, amount_total, session_id,
            )
            return

        with transaction.atomic():
            try:
                # select_for_update() locks the row so duplicate webhook deliveries can't both mark it completed
                payment = FeaturedPayment.objects.select_for_update().get(stripe_session_id=session_id)
            except FeaturedPayment.DoesNotExist:
                return

            if payment.status == 'completed':
                return  # Idempotent — already processed

            payment.status = 'completed'
            payment.completed_at = timezone.now()
            payment.save()

            if payment.listing:
                from datetime import timedelta
                listing = payment.listing
                listing.is_featured = True
                listing.featured_until = timezone.now() + timedelta(days=payment.duration_days)
                listing.save(update_fields=['is_featured', 'featured_until'])

            if payment.business:
                from django.utils import timezone as tz
                from datetime import timedelta
                business = payment.business
                business.is_featured = True
                business.featured_until = tz.now() + timedelta(days=payment.duration_days)
                business.save(update_fields=['is_featured', 'featured_until'])

        try:
            send_payment_invoice_email(payment)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error('Invoice email failed for payment %s: %s', payment.id, e)


class InvoicePDFView(APIView):
    """GET /api/payments/invoice/<listing_id>/ — download invoice PDF for latest completed payment"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, listing_id):
        try:
            listing = Listing.objects.get(pk=listing_id, user=request.user)
        except Listing.DoesNotExist:
            raise NotFound('Listing not found or not yours.')

        payment = FeaturedPayment.objects.filter(
            listing=listing, status='completed'
        ).order_by('-completed_at').first()

        if not payment:
            raise NotFound('No completed payment found for this listing.')

        pdf_bytes = generate_invoice_pdf(payment)
        invoice_num = f"INV-{payment.id:05d}"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="NepSaathi-{invoice_num}.pdf"'
        return response


class PaymentStatusView(APIView):
    """GET /api/payments/status/<listing_id>/ — check featured status for a listing"""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = [PaymentStatusThrottle]

    def get(self, request, listing_id):
        try:
            listing = Listing.objects.get(pk=listing_id, user=request.user)
        except Listing.DoesNotExist:
            raise NotFound('Listing not found or not yours.')

        latest = FeaturedPayment.objects.filter(
            listing=listing, status='completed'
        ).order_by('-completed_at').first()

        return Response({
            'is_featured': listing.is_featured,
            'last_payment': {
                'completed_at': latest.completed_at,
                'amount_paid': latest.amount_paid,
                'duration_days': latest.duration_days,
            } if latest else None,
        })
