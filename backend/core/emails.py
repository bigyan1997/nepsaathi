from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
ADMIN_URL = config('ADMIN_URL', default='https://nepsaathi-production.up.railway.app/admin')


def send_welcome_email(user):
    """Send welcome email to new user."""
    try:
        subject = 'Welcome to NepSaathi! 🎉'
        html = render_to_string('emails/welcome.html', {
            'first_name': user.first_name,
            'frontend_url': FRONTEND_URL,
        })
        msg = EmailMultiAlternatives(
            subject=subject,
            body=f'Welcome to NepSaathi, {user.first_name}! Visit us at {FRONTEND_URL}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html, 'text/html')
        msg.send()
    except Exception as e:
        print(f'Welcome email failed: {e}')


def send_report_emails(report):
    """Send report notification to admin and listing owner."""
    listing = report.listing
    try:
        # Email to admin
        html_admin = render_to_string('emails/report_admin.html', {
            'listing_title': listing.title,
            'reason': report.get_reason_display(),
            'details': report.details or 'No details provided',
            'reported_by': report.user.email,
            'listing_owner': listing.user.email,
            'admin_url': f'{ADMIN_URL}/listings/listingreport/',
        })
        msg_admin = EmailMultiAlternatives(
            subject=f'[NepSaathi] New report — {listing.title}',
            body=f'A listing has been reported: {listing.title}',
            from_email=f'NepSaathi <{settings.DEFAULT_FROM_EMAIL}>',
            to=['hello@nepsaathi.com'],
        )
        msg_admin.attach_alternative(html_admin, 'text/html')
        msg_admin.send()

        # Email to listing owner
        html_owner = render_to_string('emails/report_owner.html', {
            'first_name': listing.user.first_name,
            'listing_title': listing.title,
            'frontend_url': FRONTEND_URL,
        })
        msg_owner = EmailMultiAlternatives(
            subject=f'[NepSaathi] Your listing has been reported',
            body=f'Your listing {listing.title} has been reported.',
            from_email=f'NepSaathi <{settings.DEFAULT_FROM_EMAIL}>',
            to=[listing.user.email],
        )
        msg_owner.attach_alternative(html_owner, 'text/html')
        msg_owner.send()
    except Exception as e:
        print(f'Report email failed: {e}')