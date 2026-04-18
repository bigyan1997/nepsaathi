import resend
import threading
from django.template.loader import render_to_string
from django.conf import settings
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
ADMIN_URL = config('ADMIN_URL', default='https://nepsaathi-production.up.railway.app/admin')
RESEND_API_KEY = config('RESEND_API_KEY', default='')

resend.api_key = RESEND_API_KEY


def _send_resend(params):
    """Send email via Resend API in background."""
    if not RESEND_API_KEY:
        print(f'[DEBUG] No API key — skipping email: {params["subject"]}', flush=True)
        return
    try:
        resend.Emails.send(params)
        print(f'Email sent OK: {params["subject"]} -> {params["to"]}', flush=True)
    except Exception as e:
        print(f'Email send FAILED: {e}', flush=True)


def send_welcome_email(user):
    """Send welcome email to new user via Resend."""
    try:
        html = render_to_string('emails/welcome.html', {
            'first_name': user.first_name,
            'frontend_url': FRONTEND_URL,
        })
        params = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': [user.email],
            'subject': 'Welcome to NepSaathi! 🎉',
            'html': html,
        }
        thread = threading.Thread(target=_send_resend, args=(params,))
        thread.start()
    except Exception as e:
        print(f'Welcome email failed: {e}', flush=True)


def send_report_emails(report):
    """Send report notifications via Resend."""
    listing = report.listing
    try:
        # Email to admin
        html_admin = render_to_string('emails/report_admin.html', {
            'listing_title': listing.title,
            'reason': report.get_reason_display(),
            'details': report.details or 'No details provided',
            'reported_by': report.user.email,
            'listing_owner': listing.user.email,
            'admin_url': f'{ADMIN_URL}/listings/listingreport/{report.id}/change/',
            'listing_url': f'{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}',
        })
        params_admin = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': ['hello@nepsaathi.com'],
            'subject': f'[NepSaathi] New report — {listing.title}',
            'html': html_admin,
        }
        thread1 = threading.Thread(target=_send_resend, args=(params_admin,))
        thread1.start()

        # Email to listing owner
        html_owner = render_to_string('emails/report_owner.html', {
            'first_name': listing.user.first_name,
            'listing_title': listing.title,
            'listing_url': f'{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}',
            'frontend_url': FRONTEND_URL,
            'report_id': report.id,
        })
        params_owner = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': [listing.user.email],
            'subject': '[NepSaathi] Your listing has been reported',
            'html': html_owner,
        }
        thread2 = threading.Thread(target=_send_resend, args=(params_owner,))
        thread2.start()
    except Exception as e:
        print(f'Report email failed: {e}', flush=True)