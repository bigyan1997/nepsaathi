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
    
def send_listing_cleared_email(report):
    """Send email to listing owner when their listing is cleared."""
    listing = report.listing
    try:
        html = render_to_string('emails/listing_cleared.html', {
            'first_name': listing.user.first_name,
            'listing_title': listing.title,
            'listing_url': f'{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}',
            'frontend_url': FRONTEND_URL,
        })
        params = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': [listing.user.email],
            'subject': f'[NepSaathi] Your listing has been reviewed and cleared ✅',
            'html': html,
        }
        thread = threading.Thread(target=_send_resend, args=(params,))
        thread.start()
    except Exception as e:
        print(f'Listing cleared email failed: {e}', flush=True)


def send_listing_removed_email(report, reason):
    """Send email to listing owner when their listing is removed."""
    listing = report.listing
    try:
        html = render_to_string('emails/listing_removed.html', {
            'first_name': listing.user.first_name,
            'listing_title': listing.title,
            'reason': reason,
            'frontend_url': FRONTEND_URL,
        })
        params = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': [listing.user.email],
            'subject': f'[NepSaathi] Your listing has been removed',
            'html': html,
        }
        thread = threading.Thread(target=_send_resend, args=(params,))
        thread.start()
    except Exception as e:
        print(f'Listing removed email failed: {e}', flush=True)
    
def send_expiry_warning_email(listing):
    """Send warning email 3 days before listing expires."""
    try:
        html = render_to_string('emails/expiry_warning.html', {
            'first_name': listing.user.first_name,
            'listing_title': listing.title,
            'listing_url': f'{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}',
            'expires_at': listing.expires_at.strftime('%d %B %Y'),
            'frontend_url': FRONTEND_URL,
        })
        params = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': [listing.user.email],
            'subject': f'[NepSaathi] Your listing expires in 3 days — {listing.title}',
            'html': html,
        }
        thread = threading.Thread(target=_send_resend, args=(params,))
        thread.start()
    except Exception as e:
        print(f'Expiry warning email failed: {e}', flush=True)

def send_contact_email(name, email, subject, message):
    """Send contact form email to hello@nepsaathi.com"""
    import html as html_module
    name = html_module.escape(name)
    subject = html_module.escape(subject)
    message = html_module.escape(message)
    # Note: email is used in href so we validate but don't escape
    try:
        html = f"""
        <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="background:#26215C;padding:28px;border-radius:12px 12px 0 0;text-align:center;">
                <h2 style="color:#fff;margin:0;font-size:20px;">
                    <span style="color:#E87722;">Nep</span>Saathi — Contact Form
                </h2>
            </div>
            <div style="background:#fff;border:0.5px solid #e5e5e5;padding:28px;border-radius:0 0 12px 12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding:8px 0;font-size:13px;color:#aaa;width:100px;">From</td>
                        <td style="padding:8px 0;font-size:14px;color:#333;font-weight:600;">{name}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;font-size:13px;color:#aaa;">Email</td>
                        <td style="padding:8px 0;font-size:14px;color:#534AB7;">
                            <a href="mailto:{email}" style="color:#534AB7;">{email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;font-size:13px;color:#aaa;">Subject</td>
                        <td style="padding:8px 0;font-size:14px;color:#333;">{subject}</td>
                    </tr>
                </table>
                <hr style="border:none;border-top:0.5px solid #e5e5e5;margin:20px 0;">
                <p style="font-size:13px;color:#aaa;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
                <p style="font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">{message}</p>
                <hr style="border:none;border-top:0.5px solid #e5e5e5;margin:20px 0;">
                <p style="font-size:12px;color:#aaa;margin:0;">
                    Reply directly to <a href="mailto:{email}" style="color:#534AB7;">{email}</a> to respond to this enquiry.
                </p>
            </div>
        </div>
        """
        # Send to admin
        params = {
            'from': 'NepSaathi Contact <noreply@nepsaathi.com>',
            'to': ['hello@nepsaathi.com'],
            'reply_to': email,
            'subject': f'[Contact] {subject} — from {name}',
            'html': html,
        }
        thread = threading.Thread(target=_send_resend, args=(params,))
        thread.start()

        # Send confirmation to user
        confirmation_html = f"""
        <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="background:linear-gradient(135deg,#26215C,#534AB7);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
                <span style="font-size:28px;font-weight:700;color:#fff;">
                    <span style="color:#E87722;">Nep</span>Saathi
                </span>
                <br>
                <span style="font-size:13px;color:#AFA9EC;">नेपसाथी · your Nepali friend, wherever you are</span>
            </div>

            <div style="background:#fff;border:0.5px solid #e5e5e5;padding:32px;border-radius:0 0 16px 16px;">
                <h2 style="font-size:22px;font-weight:700;color:#26215C;margin:0 0 8px;">
                    We got your message! ✅
                </h2>
                <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
                    Hi <strong>{name}</strong>, thanks for reaching out to NepSaathi. 
                    We'll get back to you within 24 hours at <strong>{email}</strong>.
                </p>

                <!-- Message summary -->
                <div style="background:#F5F4F0;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.05em;">Your message</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                        <tr>
                            <td style="padding:6px 0;font-size:12px;color:#aaa;width:80px;">Subject</td>
                            <td style="padding:6px 0;font-size:13px;color:#333;font-weight:500;">{subject}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0;font-size:12px;color:#aaa;vertical-align:top;">Message</td>
                            <td style="padding:6px 0;font-size:13px;color:#555;line-height:1.7;white-space:pre-wrap;">{message}</td>
                        </tr>
                    </table>
                </div>

                <!-- Info box -->
                <div style="background:#EEEDFE;border:0.5px solid #AFA9EC;border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="margin:0;font-size:13px;color:#3C3489;line-height:1.7;">
                        💬 If your enquiry is urgent, you can also reach us directly at 
                        <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;font-weight:600;">hello@nepsaathi.com</a>
                    </p>
                </div>

                <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
                    © 2026 NepSaathi · 
                    <a href="{FRONTEND_URL}" style="color:#534AB7;text-decoration:none;">nepsaathi.com</a>
                </p>
            </div>
        </div>
        """

        confirmation_params = {
            'from': 'NepSaathi <noreply@nepsaathi.com>',
            'to': [email],
            'subject': f'We received your message — NepSaathi',
            'html': confirmation_html,
        }
        thread2 = threading.Thread(target=_send_resend, args=(confirmation_params,))
        thread2.start()
    except Exception as e:
        print(f'Contact email failed: {e}', flush=True)