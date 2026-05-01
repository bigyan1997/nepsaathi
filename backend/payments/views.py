import stripe
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from listings.models import Listing
from .models import FeaturedPayment


class CreateCheckoutSessionView(APIView):
    """
    POST /api/payments/feature/<listing_id>/
    Creates a Stripe checkout session to feature a listing for 7 days.
    Owner only.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, listing_id):
        try:
            listing = Listing.objects.get(pk=listing_id, user=request.user, status='active')
        except Listing.DoesNotExist:
            raise NotFound('Active listing not found or not yours.')

        if listing.renewal_blocked or listing.is_under_review:
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
            success_url=f'{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/payment/cancel',
            metadata={
                'listing_id': str(listing.id),
                'user_id': str(request.user.id),
                'duration_days': '7',
            },
            client_reference_id=str(listing.id),
        )

        FeaturedPayment.objects.create(
            listing=listing,
            user=request.user,
            stripe_session_id=session.id,
            amount_paid=settings.STRIPE_FEATURED_PRICE_CENTS,
            duration_days=7,
            status='pending',
        )

        return Response({'checkout_url': session.url})


@method_decorator(csrf_exempt, name='dispatch')
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
            return Response({'error': 'Invalid signature'}, status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            self._handle_checkout_completed(session)

        return Response({'status': 'ok'})

    def _handle_checkout_completed(self, session):
        session_id = session['id']
        try:
            payment = FeaturedPayment.objects.get(stripe_session_id=session_id)
        except FeaturedPayment.DoesNotExist:
            return

        if payment.status == 'completed':
            return  # Idempotent — already processed

        payment.status = 'completed'
        payment.completed_at = timezone.now()
        payment.save()

        if payment.listing:
            listing = payment.listing
            listing.is_featured = True
            listing.save(update_fields=['is_featured'])


class PaymentStatusView(APIView):
    """GET /api/payments/status/<listing_id>/ — check featured status for a listing"""
    permission_classes = (permissions.IsAuthenticated,)

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
