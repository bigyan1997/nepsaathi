import html as html_module
import resend
import threading
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
ADMIN_URL    = config('ADMIN_URL',    default='https://nepsaathi-production.up.railway.app/admin')

# ─────────────────────────────────────────────────────────────
# SHARED BASE COMPONENTS
# ─────────────────────────────────────────────────────────────

_LOGO = """
<div style="background:#26215C;border-radius:16px 16px 0 0;padding:28px 40px 24px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
    <tr>
      <td style="vertical-align:middle;">
        <!-- Two overlapping circles -->
        <table cellpadding="0" cellspacing="0" style="display:inline-table;">
          <tr>
            <td>
              <div style="width:28px;height:28px;border-radius:50%;background:#E87722;display:inline-block;vertical-align:middle;"></div>
              <div style="width:28px;height:28px;border-radius:50%;background:#534AB7;display:inline-block;vertical-align:middle;margin-left:-10px;"></div>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:-apple-system,Arial,sans-serif;letter-spacing:-0.3px;">
                <span style="color:#E87722;">Nep</span>Saathi
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="font-size:12px;color:#AFA9EC;letter-spacing:0.04em;font-family:-apple-system,Arial,sans-serif;">
    &#2344;&#2375;&#2346;&#2360;&#2366;&#2341;&#2368; &nbsp;&middot;&nbsp; your Nepali friend, wherever you are
  </div>
</div>
"""

def _footer():
    return f"""
<div style="background:#F5F4F0;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border:1px solid #e8e8e8;border-top:none;">
  <p style="font-size:12px;color:#aaaaaa;margin:0 0 4px;font-family:-apple-system,Arial,sans-serif;">
    &copy; 2026 NepSaathi &nbsp;&middot;&nbsp;
    <a href="{FRONTEND_URL}" style="color:#534AB7;text-decoration:none;">nepsaathi.com</a>
    &nbsp;&middot;&nbsp;
    <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;text-decoration:none;">Contact us</a>
  </p>
  <p style="font-size:11px;color:#cccccc;margin:0;font-family:-apple-system,Arial,sans-serif;">
    NepSaathi &middot; Australia &middot; noreply@nepsaathi.com
  </p>
</div>
"""

def _wrap(body: str) -> str:
    """Wraps body HTML in the full email shell: outer bg → logo header → white body → footer."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#e8e6e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e6e0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
          <tr>
            <td>
              {_LOGO}
              <div style="background:#ffffff;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;padding:36px 40px;">
                {body}
              </div>
              {_footer()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def _btn(label: str, url: str, color: str = "#E87722") -> str:
    return f"""
<div style="text-align:center;margin:28px 0;">
  <a href="{url}" style="display:inline-block;background:{color};color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">
    {label}
  </a>
</div>"""

def _info_box(text: str, bg: str = "#EEEDFE", border: str = "#AFA9EC", color: str = "#3C3489") -> str:
    return f"""
<div style="background:{bg};border:1px solid {border};border-radius:10px;padding:16px 20px;margin:20px 0;">
  <p style="margin:0;font-size:13px;color:{color};line-height:1.7;font-family:-apple-system,Arial,sans-serif;">{text}</p>
</div>"""

def _listing_card(title: str, url: str, meta: str = "", emoji: str = "&#128204;", bg: str = "#EEEDFE") -> str:
    return f"""
<div style="background:#F5F4F0;border-radius:12px;padding:18px 20px;margin:20px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="44" style="vertical-align:middle;padding-right:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:{bg};text-align:center;line-height:40px;font-size:20px;">{emoji}</div>
      </td>
      <td style="vertical-align:middle;">
        <div style="font-size:14px;font-weight:700;color:#26215C;margin-bottom:3px;font-family:-apple-system,Arial,sans-serif;">{title}</div>
        <div style="font-size:12px;color:#888888;font-family:-apple-system,Arial,sans-serif;">{meta}</div>
      </td>
      <td width="60" style="vertical-align:middle;text-align:right;">
        <a href="{url}" style="font-size:13px;color:#534AB7;font-weight:700;text-decoration:none;font-family:-apple-system,Arial,sans-serif;">View &rarr;</a>
      </td>
    </tr>
  </table>
</div>"""

_DIVIDER = '<hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">'
_P       = 'style="font-size:14px;color:#555555;line-height:1.8;margin:0 0 16px;font-family:-apple-system,Arial,sans-serif;"'
_H1      = 'style="font-size:22px;font-weight:700;color:#26215C;margin:0 0 12px;font-family:-apple-system,Arial,sans-serif;"'
_SMALL   = 'style="font-size:12px;color:#aaaaaa;line-height:1.6;text-align:center;font-family:-apple-system,Arial,sans-serif;"'


# ─────────────────────────────────────────────────────────────
# RESEND HELPER
# ─────────────────────────────────────────────────────────────

def _send_resend(params: dict):
    api_key = config('RESEND_API_KEY', default='')
    if not api_key:
        print(f'[EMAIL ERROR] RESEND_API_KEY not set — skipping: {params["subject"]}', flush=True)
        return
    resend.api_key = api_key
    try:
        response = resend.Emails.send(params)
        print(f'[EMAIL OK] {params["subject"]} -> {params["to"]} | id={getattr(response, "id", response)}', flush=True)
    except Exception as e:
        import traceback
        print(f'[EMAIL ERROR] Failed to send "{params["subject"]}" to {params["to"]}: {e}', flush=True)
        print(traceback.format_exc(), flush=True)

def _fire(params: dict):
    """Send in background thread."""
    threading.Thread(target=_send_resend, args=(params,), daemon=True).start()


# ─────────────────────────────────────────────────────────────
# 1. WELCOME EMAIL
# ─────────────────────────────────────────────────────────────

def send_welcome_email(user):
    try:
        first_name = user.first_name or 'there'
        body = f"""
<h1 {_H1}>Welcome to NepSaathi! &#127881;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, we're so excited to have you in our community.
  NepSaathi is your hub for jobs, rooms, events, announcements and businesses
  across Australia — all in one place, all free.
</p>

{_btn("Explore NepSaathi &rarr;", FRONTEND_URL)}

<table width="100%" cellpadding="0" cellspacing="8" style="margin:0 0 24px;">
  <tr>
    <td width="31%" style="padding:0 4px 0 0;">
      <div style="background:#EEEDFE;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">&#128188;</div>
        <div style="font-size:12px;font-weight:700;color:#3C3489;font-family:-apple-system,Arial,sans-serif;">Find jobs</div>
      </div>
    </td>
    <td width="4%"></td>
    <td width="31%" style="padding:0 2px;">
      <div style="background:#FFF1E0;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">&#127968;</div>
        <div style="font-size:12px;font-weight:700;color:#633806;font-family:-apple-system,Arial,sans-serif;">Find rooms</div>
      </div>
    </td>
    <td width="4%"></td>
    <td width="31%" style="padding:0 0 0 4px;">
      <div style="background:#E1F5EE;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">&#127881;</div>
        <div style="font-size:12px;font-weight:700;color:#085041;font-family:-apple-system,Arial,sans-serif;">Events</div>
      </div>
    </td>
  </tr>
</table>

{_DIVIDER}
<p {_SMALL}>
  Questions? Email us at
  <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;text-decoration:none;">hello@nepsaathi.com</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': 'Welcome to NepSaathi! &#127881;',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Welcome email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 2. EMAIL VERIFICATION
# ─────────────────────────────────────────────────────────────

def send_email_verification_email(user, email, confirm_url):
    try:
        first_name = getattr(user, 'first_name', None) or 'there'
        safe_url = html_module.escape(confirm_url)
        body = f"""
<h1 {_H1}>Verify your email address &#9993;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, thanks for joining NepSaathi!
  Click the button below to verify your email and activate your account.
</p>

{_btn("Verify my email &rarr;", safe_url)}

{_DIVIDER}
<p style="font-size:12px;color:#aaaaaa;margin:0 0 8px;font-family:-apple-system,Arial,sans-serif;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="font-size:12px;color:#534AB7;word-break:break-all;margin:0 0 20px;font-family:-apple-system,Arial,sans-serif;">
  <a href="{safe_url}" style="color:#534AB7;">{safe_url}</a>
</p>
{_DIVIDER}
<p {_SMALL}>If you didn't create a NepSaathi account, you can safely ignore this email.</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [email],
            'subject': 'Verify your NepSaathi email address',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Verification email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 3. PASSWORD RESET
# ─────────────────────────────────────────────────────────────

def send_password_reset_email(user, reset_url):
    try:
        first_name = user.first_name or 'there'
        safe_url = html_module.escape(reset_url)
        body = f"""
<h1 {_H1}>Reset your password &#128274;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, we received a request to reset your NepSaathi password.
  Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
</p>

{_btn("Reset my password &rarr;", safe_url, color="#534AB7")}

{_info_box(
    "&#128274; If you didn't request a password reset, you can safely ignore this email. "
    "Your password will not be changed.",
    bg="#FFF1E0", border="#EFD9C0", color="#633806"
)}

{_DIVIDER}
<p style="font-size:12px;color:#aaaaaa;margin:0 0 8px;font-family:-apple-system,Arial,sans-serif;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="font-size:12px;color:#534AB7;word-break:break-all;margin:0;font-family:-apple-system,Arial,sans-serif;">
  <a href="{safe_url}" style="color:#534AB7;">{safe_url}</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': 'Reset your NepSaathi password',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Password reset email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 4. REPORT EMAILS (admin + owner)
# ─────────────────────────────────────────────────────────────

def send_report_emails(report):
    listing = report.listing
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}"
    admin_review_url = f"{ADMIN_URL}/listings/listingreport/{report.id}/change/"

    try:
        # — Admin notification —
        admin_body = f"""
<h1 {_H1}>New listing report &#9888;</h1>
<p {_P}>A listing has been reported and requires your review.</p>

{_listing_card(
    listing.title,
    listing_url,
    f"Reported by: {report.user.email} &middot; Owner: {listing.user.email}",
    bg="#FCEBEB"
)}

{_info_box(
    f"<strong>Reason:</strong> {report.get_reason_display()}<br>"
    f"<strong>Details:</strong> {html_module.escape(report.details or 'No details provided')}",
    bg="#FCEBEB", border="#F09595", color="#A32D2D"
)}

{_btn("Review in admin panel &rarr;", admin_review_url, color="#26215C")}

{_DIVIDER}
<p {_SMALL}>This is an automated message from NepSaathi.</p>"""

        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      ['hello@nepsaathi.com'],
            'subject': f'[NepSaathi] New report — {listing.title}',
            'html':    _wrap(admin_body),
        })

        # — Owner notification —
        first_name = listing.user.first_name or 'there'
        owner_body = f"""
<h1 {_H1}>Your listing has been reported</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, we wanted to let you know that one of your listings
  has received a report from another NepSaathi member. Our team is reviewing it.
</p>

{_listing_card(listing.title, listing_url, f"Report ID: #{report.id}", bg="#FFF1E0")}

{_info_box(
    "&#9989; If your listing follows our community guidelines, no action will be taken "
    "and it will remain live. We typically review reports within 24 hours.",
    bg="#EEEDFE", border="#AFA9EC", color="#3C3489"
)}

{_DIVIDER}
<p {_SMALL}>
  Questions? Contact us at
  <a href="mailto:support@nepsaathi.com" style="color:#534AB7;text-decoration:none;">support@nepsaathi.com</a>
</p>"""

        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [listing.user.email],
            'subject': '[NepSaathi] Your listing has been reported',
            'html':    _wrap(owner_body),
        })
    except Exception as e:
        print(f'Report email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 5. LISTING CLEARED
# ─────────────────────────────────────────────────────────────

def send_listing_cleared_email(report):
    listing = report.listing
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}"
    try:
        first_name = listing.user.first_name or 'there'
        body = f"""
<h1 {_H1}>Your listing has been cleared &#9989;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, good news! Our team has reviewed the report on your listing
  and found that it complies with our community guidelines. Your listing remains live.
</p>

{_listing_card(listing.title, listing_url, "Status: Active &middot; No action required", bg="#E1F5EE")}

{_info_box(
    "&#9989; No action is required from you. Your listing continues to be visible "
    "to the NepSaathi community.",
    bg="#E1F5EE", border="#9FE1CB", color="#085041"
)}

{_btn("View your listing &rarr;", listing_url, color="#1D9E75")}

{_DIVIDER}
<p {_SMALL}>
  Thank you for being a valued member of NepSaathi. If you have any questions,
  contact us at <a href="mailto:support@nepsaathi.com" style="color:#534AB7;text-decoration:none;">support@nepsaathi.com</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [listing.user.email],
            'subject': '[NepSaathi] Your listing has been reviewed and cleared',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Listing cleared email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 6. LISTING REMOVED
# ─────────────────────────────────────────────────────────────

def send_listing_removed_email(report, reason):
    listing = report.listing
    try:
        first_name = listing.user.first_name or 'there'
        safe_reason = html_module.escape(str(reason))
        body = f"""
<h1 {_H1}>Your listing has been removed</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, after reviewing a report on your listing, our team has
  determined that it does not comply with NepSaathi's community guidelines and has been removed.
</p>

{_info_box(
    f"<strong>Listing:</strong> {html_module.escape(listing.title)}<br>"
    f"<strong>Reason for removal:</strong> {safe_reason}",
    bg="#FCEBEB", border="#F09595", color="#A32D2D"
)}

<p {_P}>
  If you believe this decision was made in error, please contact our support team
  and we will review your case as soon as possible.
</p>

{_btn("Contact support &rarr;", "mailto:support@nepsaathi.com", color="#26215C")}

{_DIVIDER}
<p {_SMALL}>
  Please review our
  <a href="{FRONTEND_URL}/terms" style="color:#534AB7;text-decoration:none;">Terms of Use</a>
  before posting again. Thank you for your understanding.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [listing.user.email],
            'subject': '[NepSaathi] Your listing has been removed',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Listing removed email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 7. EXPIRY WARNING
# ─────────────────────────────────────────────────────────────

def send_expiry_warning_email(listing):
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/listing/{listing.id}"
    my_listings_url = f"{FRONTEND_URL}/my-listings"
    try:
        first_name = listing.user.first_name or 'there'
        expires_at = listing.expires_at.strftime('%d %B %Y')
        body = f"""
<h1 {_H1}>Your listing expires in 3 days &#9201;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, just a heads up — your listing is expiring soon.
  Renew it in one click to keep it live and visible to the community.
</p>

{_listing_card(
    listing.title,
    listing_url,
    f"Expires: {expires_at}",
    bg="#FFF1E0"
)}

{_info_box(
    "&#128260; Renewing extends your listing by 30 days and is completely free. "
    "Go to My Listings to renew with one click.",
    bg="#FFF1E0", border="#EFD9C0", color="#633806"
)}

{_btn("Renew my listing &rarr;", my_listings_url, color="#E87722")}

{_DIVIDER}
<p {_SMALL}>
  Once expired, your listing will no longer be visible. You can always repost from
  <a href="{my_listings_url}" style="color:#534AB7;text-decoration:none;">My Listings</a>.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [listing.user.email],
            'subject': f'[NepSaathi] Your listing expires in 3 days — {listing.title}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Expiry warning email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 8. CONTACT FORM (admin + user confirmation)
# ─────────────────────────────────────────────────────────────

def send_contact_email(name, email, subject, message):
    safe_name    = html_module.escape(name)
    safe_subject = html_module.escape(subject)
    safe_message = html_module.escape(message)

    try:
        # — Admin notification —
        admin_body = f"""
<h1 {_H1}>New contact form submission</h1>

<div style="background:#F5F4F0;border-radius:12px;padding:20px 24px;margin:20px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:8px 0;font-size:12px;color:#aaaaaa;width:90px;font-family:-apple-system,Arial,sans-serif;">From</td>
      <td style="padding:8px 0;font-size:14px;color:#26215C;font-weight:700;font-family:-apple-system,Arial,sans-serif;">{safe_name}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-size:12px;color:#aaaaaa;font-family:-apple-system,Arial,sans-serif;">Email</td>
      <td style="padding:8px 0;font-size:14px;font-family:-apple-system,Arial,sans-serif;">
        <a href="mailto:{email}" style="color:#534AB7;text-decoration:none;">{email}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-size:12px;color:#aaaaaa;font-family:-apple-system,Arial,sans-serif;">Subject</td>
      <td style="padding:8px 0;font-size:14px;color:#26215C;font-family:-apple-system,Arial,sans-serif;">{safe_subject}</td>
    </tr>
  </table>
</div>

{_DIVIDER}
<p style="font-size:11px;color:#aaaaaa;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;font-family:-apple-system,Arial,sans-serif;">Message</p>
<p style="font-size:14px;color:#555555;line-height:1.8;white-space:pre-wrap;font-family:-apple-system,Arial,sans-serif;">{safe_message}</p>
{_DIVIDER}
<p {_SMALL}>
  Reply directly to <a href="mailto:{email}" style="color:#534AB7;text-decoration:none;">{email}</a> to respond.
</p>"""

        _fire({
            'from':     'NepSaathi Contact <noreply@nepsaathi.com>',
            'to':       ['hello@nepsaathi.com'],
            'reply_to': f'{safe_name} <{email}>',
            'subject':  f'[Contact] {safe_subject} — from {safe_name}',
            'html':     _wrap(admin_body),
        })

        # — User confirmation —
        user_body = f"""
<h1 {_H1}>We got your message! &#9989;</h1>
<p {_P}>
  Hi <strong>{safe_name}</strong>, thanks for reaching out to NepSaathi.
  We'll get back to you within 24 hours at <strong>{email}</strong>.
</p>

<div style="background:#F5F4F0;border-radius:12px;padding:20px 24px;margin:20px 0;">
  <p style="margin:0 0 12px;font-size:11px;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.05em;font-family:-apple-system,Arial,sans-serif;">Your message</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:6px 0;font-size:12px;color:#aaaaaa;width:80px;font-family:-apple-system,Arial,sans-serif;">Subject</td>
      <td style="padding:6px 0;font-size:13px;color:#333333;font-weight:600;font-family:-apple-system,Arial,sans-serif;">{safe_subject}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;font-size:12px;color:#aaaaaa;vertical-align:top;font-family:-apple-system,Arial,sans-serif;">Message</td>
      <td style="padding:6px 0;font-size:13px;color:#555555;line-height:1.7;white-space:pre-wrap;font-family:-apple-system,Arial,sans-serif;">{safe_message}</td>
    </tr>
  </table>
</div>

{_info_box(
    "&#128172; If your enquiry is urgent, you can also reach us directly at "
    "<a href='mailto:hello@nepsaathi.com' style='color:#534AB7;font-weight:600;'>hello@nepsaathi.com</a>",
    bg="#EEEDFE", border="#AFA9EC", color="#3C3489"
)}

{_DIVIDER}
<p {_SMALL}>Thank you for being part of the NepSaathi community.</p>"""

        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [email],
            'subject': 'We received your message — NepSaathi',
            'html':    _wrap(user_body),
        })
    except Exception as e:
        print(f'Contact email failed: {e}', flush=True)