from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core import signing
from django.http import HttpResponse
from django.views import View
from .serializers import FeedbackSerializer
from .models import FeedbackResponse, NewsletterSubscriber
from .sheets import sync_to_sheet
from core.emails import send_newsletter_welcome_email
from users.throttles import NewsletterThrottle


class FeedbackView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None
        feedback = FeedbackResponse.objects.create(
            satisfaction=serializer.validated_data['satisfaction'],
            reason=serializer.validated_data['reason'],
            message=serializer.validated_data.get('message', ''),
            page_url=serializer.validated_data.get('page_url', ''),
            user=user,
        )
        sync_to_sheet(feedback)
        return Response({'detail': 'Thank you for your feedback!'}, status=status.HTTP_201_CREATED)


class NewsletterSubscribeView(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (NewsletterThrottle,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({'detail': 'A valid email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={'is_active': True},
        )
        if not created and subscriber.is_active:
            return Response({'detail': "You're already subscribed."}, status=status.HTTP_200_OK)

        if not created:
            subscriber.is_active = True
            subscriber.save(update_fields=['is_active'])

        send_newsletter_welcome_email(email)
        return Response({'detail': "You're subscribed! Check your inbox for a welcome email."}, status=status.HTTP_201_CREATED)


class NewsletterUnsubscribeView(View):
    """GET /api/newsletter/unsubscribe/?token=<signed_token>
    One-click unsubscribe linked from every newsletter email.
    Returns a small HTML confirmation page — no login required.
    """

    def get(self, request):
        token = request.GET.get('token', '')
        try:
            email = signing.loads(token, max_age=365 * 24 * 3600, salt='newsletter-unsub')
            NewsletterSubscriber.objects.filter(email=email).update(is_active=False)
            success = True
        except signing.BadSignature:
            success = False

        if success:
            heading = '&#x2713; Unsubscribed'
            msg = "You've been successfully unsubscribed from NepSaathi newsletters."
            color = '#1D9E75'
        else:
            heading = 'Invalid link'
            msg = "This unsubscribe link is invalid or has expired. Please contact us if you need help."
            color = '#E53E3E'

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe &#8212; NepSaathi</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:system-ui,-apple-system,sans-serif;background:#F5F4F0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}}
.card{{background:#fff;border-radius:16px;padding:48px 36px;max-width:460px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}}
.icon{{font-size:40px;margin-bottom:16px}}
h1{{color:{color};font-size:22px;font-weight:700;margin-bottom:12px}}
p{{color:#555;font-size:15px;line-height:1.6;margin-bottom:28px}}
a{{display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600}}
</style>
</head>
<body>
<div class="card">
  <div class="icon">{'&#x1F4E7;' if success else '&#x26A0;'}</div>
  <h1>{heading}</h1>
  <p>{msg}</p>
  <a href="https://www.nepsaathi.com">Back to NepSaathi</a>
</div>
</body>
</html>"""
        return HttpResponse(html, status=200 if success else 400)
