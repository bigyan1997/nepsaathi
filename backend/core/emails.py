import html as html_module
import resend
import threading
from datetime import timedelta
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
ADMIN_URL    = config('ADMIN_URL',    default='https://nepsaathi-production.up.railway.app/nepsaathi-admin')

# ─────────────────────────────────────────────────────────────
# SHARED BASE COMPONENTS
# ─────────────────────────────────────────────────────────────

_LOGO = """
<div style="background:#26215C;border-radius:16px 16px 0 0;padding:28px 40px 24px;text-align:center;">
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 12px;">
    <tr>
      <!-- SVG overlapping circles — matches logo-dark.svg exactly (r=15, 48% overlap → cx=29) -->
      <td style="vertical-align:middle;padding-right:10px;">
        <svg width="44" height="30" viewBox="0 0 44 30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="15" r="15" fill="#E87722"/>
          <circle cx="29" cy="15" r="15" fill="#AFA9EC" fill-opacity="0.88"/>
        </svg>
      </td>
      <!-- Wordmark -->
      <td style="vertical-align:middle;">
        <span style="font-size:24px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;letter-spacing:-0.3px;line-height:1;">
          <span style="color:#E87722;">Nep</span>Saathi
        </span>
      </td>
    </tr>
  </table>
  <div style="font-size:12px;color:#AFA9EC;letter-spacing:0.04em;font-family:Arial,sans-serif;">
    &#2344;&#2375;&#2346;&#2360;&#2366;&#2341;&#2368; &nbsp;&middot;&nbsp; your Nepali friend, wherever you are
  </div>
</div>
"""

def _footer():
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td bgcolor="#F5F4F0" style="background-color:#F5F4F0 !important;border-radius:0 0 16px 16px;padding:20px 28px;text-align:center;border:1px solid #e8e8e8;border-top:none;" class="footer-pad">
      <p style="font-size:12px;color:#aaaaaa;margin:0 0 4px;font-family:Arial,sans-serif;">
        &copy; 2026 NepSaathi &nbsp;&middot;&nbsp;
        <a href="{FRONTEND_URL}" style="color:#534AB7;text-decoration:none;">nepsaathi.com</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;text-decoration:none;">Contact us</a>
      </p>
      <p style="font-size:11px;color:#cccccc;margin:0;font-family:Arial,sans-serif;">
        NepSaathi &middot; Australia &middot; noreply@nepsaathi.com
      </p>
    </td>
  </tr>
</table>
"""

def _wrap(body: str) -> str:
    """Wraps body HTML in the full email shell: outer bg → logo header → white body → footer."""
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root {{ color-scheme: light only; supported-color-schemes: light; }}
    body {{ background-color:#e8e6e0 !important; }}
    @media only screen and (max-width: 480px) {{
      .outer-pad {{ padding: 16px 8px !important; }}
      .body-pad   {{ padding: 24px 16px !important; }}
      .footer-pad {{ padding: 14px 16px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#e8e6e0 !important;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;" bgcolor="#e8e6e0">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="#e8e6e0" style="background-color:#e8e6e0 !important;padding:28px 12px;" class="outer-pad">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;width:100%;">
          <tr>
            <td>
              {_LOGO}
              <!-- White body — bgcolor + !important guards against dark-mode overrides -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="#ffffff" style="background-color:#ffffff !important;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;">
                <tr>
                  <td style="padding:28px 28px;background-color:#ffffff !important;" bgcolor="#ffffff" class="body-pad">
                    {body}
                  </td>
                </tr>
              </table>
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
  <a href="{url}" style="display:inline-block;background:{color};color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">
    {label}
  </a>
</div>"""

def _info_box(text: str, bg: str = "#EEEDFE", border: str = "#AFA9EC", color: str = "#3C3489") -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;">
  <tr>
    <td bgcolor="{bg}" style="background-color:{bg} !important;border:1px solid {border};border-radius:10px;padding:14px 16px;">
      <p style="margin:0;font-size:13px;color:{color} !important;line-height:1.7;font-family:Arial,sans-serif;">{text}</p>
    </td>
  </tr>
</table>"""

def _listing_card(title: str, url: str, meta: str = "", emoji: str = "&#128204;", bg: str = "#EEEDFE") -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;">
  <tr>
    <td bgcolor="#F5F4F0" style="background-color:#F5F4F0 !important;border-radius:12px;padding:14px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="48" style="vertical-align:middle;padding-right:12px;">
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td bgcolor="{bg}" style="background-color:{bg} !important;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">{emoji}</td>
              </tr>
            </table>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:14px;font-weight:700;color:#26215C !important;margin-bottom:3px;font-family:Arial,sans-serif;">{title}</div>
            <div style="font-size:12px;color:#888888 !important;font-family:Arial,sans-serif;">{meta}</div>
          </td>
          <td width="50" style="vertical-align:middle;text-align:right;padding-left:8px;">
            <a href="{url}" style="font-size:13px;color:#534AB7 !important;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;white-space:nowrap;">View &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""

_DIVIDER = '<hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">'
_P       = 'style="font-size:14px;color:#555555;line-height:1.8;margin:0 0 16px;font-family:Arial,sans-serif;"'
_H1      = 'style="font-size:22px;font-weight:700;color:#26215C;margin:0 0 12px;font-family:Arial,sans-serif;"'
_SMALL   = 'style="font-size:12px;color:#aaaaaa;line-height:1.6;text-align:center;font-family:Arial,sans-serif;"'


# ─────────────────────────────────────────────────────────────
# RESEND HELPER
# ─────────────────────────────────────────────────────────────

def _send_resend(params: dict):
    resend.api_key = config('RESEND_API_KEY')
    try:
        send_params = dict(params)
        if 'attachments' in send_params:
            send_params['attachments'] = [
                {'filename': a['filename'], 'content': list(a['content'])}
                for a in send_params['attachments']
            ]
        response = resend.Emails.send(send_params)
        print(f'[EMAIL OK] {params["subject"]} -> {params["to"]} | id={getattr(response, "id", response)}', flush=True)
    except Exception as e:
        import traceback
        print(f'[EMAIL ERROR] Failed to send "{params["subject"]}" to {params["to"]}: {e}', flush=True)
        print(traceback.format_exc(), flush=True)


def _send_smtp(params: dict):
    from django.core.mail import EmailMessage, get_connection
    try:
        connection = get_connection(backend='django.core.mail.backends.smtp.EmailBackend')
        msg = EmailMessage(
            subject=params['subject'],
            body=params['html'],
            from_email=params.get('from', 'NepSaathi <noreply@nepsaathi.com>'),
            to=params['to'],
            reply_to=[params['reply_to']] if 'reply_to' in params else None,
            connection=connection,
        )
        msg.content_subtype = 'html'
        for att in params.get('attachments', []):
            msg.attach(att['filename'], att['content'], att.get('content_type', 'application/octet-stream'))
        msg.send()
        print(f'[EMAIL OK] {params["subject"]} -> {params["to"]} (SMTP)', flush=True)
    except Exception as e:
        import traceback
        print(f'[EMAIL ERROR] Failed to send "{params["subject"]}" to {params["to"]}: {e}', flush=True)
        print(traceback.format_exc(), flush=True)


def _fire(params: dict):
    """Resend in production (RESEND_API_KEY set), Django SMTP locally."""
    if config('RESEND_API_KEY', default=''):
        threading.Thread(target=_send_resend, args=(params,), daemon=True).start()
    else:
        threading.Thread(target=_send_smtp, args=(params,), daemon=True).start()


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
  NepSaathi is your hub for jobs, rooms, events, notices and businesses
  across Australia — all in one place, all free.
</p>

{_btn("Explore NepSaathi &rarr;", FRONTEND_URL)}

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
  <tr>
    <td width="31%" style="padding:0 4px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td bgcolor="#EEEDFE" style="background-color:#EEEDFE;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:22px;margin-bottom:6px;">&#128188;</div>
            <div style="font-size:12px;font-weight:700;color:#3C3489;font-family:Arial,sans-serif;">Find jobs</div>
          </td>
        </tr>
      </table>
    </td>
    <td width="4%"></td>
    <td width="31%" style="padding:0 2px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td bgcolor="#FFF1E0" style="background-color:#FFF1E0;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:22px;margin-bottom:6px;">&#127968;</div>
            <div style="font-size:12px;font-weight:700;color:#633806;font-family:Arial,sans-serif;">Find rooms</div>
          </td>
        </tr>
      </table>
    </td>
    <td width="4%"></td>
    <td width="31%" style="padding:0 0 0 4px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td bgcolor="#E1F5EE" style="background-color:#E1F5EE;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:22px;margin-bottom:6px;">&#127881;</div>
            <div style="font-size:12px;font-weight:700;color:#085041;font-family:Arial,sans-serif;">Events</div>
          </td>
        </tr>
      </table>
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
            'subject': 'Welcome to NepSaathi!',
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
<p style="font-size:12px;color:#aaaaaa;margin:0 0 8px;font-family:Arial,sans-serif;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="font-size:12px;color:#534AB7;word-break:break-all;margin:0 0 20px;font-family:Arial,sans-serif;">
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
<p style="font-size:12px;color:#aaaaaa;margin:0 0 8px;font-family:Arial,sans-serif;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="font-size:12px;color:#534AB7;word-break:break-all;margin:0;font-family:Arial,sans-serif;">
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
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/{listing.slug}"
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
            'to':      ['support@nepsaathi.com'],
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
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/{listing.slug}"
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
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/{listing.slug}"
    my_listings_url = f"{FRONTEND_URL}/my-listings"
    try:
        first_name = listing.user.first_name or 'there'
        expires_at = listing.expires_at.strftime('%d %B %Y')
        body = f"""
<h1 {_H1}>Your listing is expiring soon &#9201;</h1>
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
            'subject': f'[NepSaathi] Your listing is expiring soon — {listing.title}',
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

{_listing_card(
    safe_name,
    f"mailto:{email}",
    f"Subject: {safe_subject}",
    emoji="&#128140;",
    bg="#EEEDFE"
)}

{_DIVIDER}
<p style="font-size:11px;color:#aaaaaa;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,sans-serif;">Message</p>
<p style="font-size:14px;color:#555555;line-height:1.8;white-space:pre-wrap;font-family:Arial,sans-serif;">{safe_message}</p>
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

{_info_box(
    f"<strong>Subject:</strong> {safe_subject}<br><br>"
    f"{safe_message}",
    bg="#F5F4F0", border="#e8e8e8", color="#555555"
)}

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


# ─────────────────────────────────────────────────────────────
# 9. BUSINESS REPORT EMAILS (admin + owner)
# ─────────────────────────────────────────────────────────────

def send_business_report_emails(report):
    business = report.business
    business_url = f"{FRONTEND_URL}/businesses/{business.slug}"
    admin_review_url = f"{ADMIN_URL}/businesses/businessreport/{report.id}/change/"

    try:
        # — Admin notification —
        admin_body = f"""
<h1 {_H1}>New business report &#9888;</h1>
<p {_P}>A business has been reported and requires your review.</p>

{_listing_card(
    business.business_name,
    business_url,
    f"Reported by: {report.user.email} &middot; Owner: {business.owner.email}",
    emoji="&#127981;",
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
            'to':      ['support@nepsaathi.com'],
            'subject': f'[NepSaathi] New business report — {business.business_name}',
            'html':    _wrap(admin_body),
        })

        # — Owner notification —
        first_name = business.owner.first_name or 'there'
        owner_body = f"""
<h1 {_H1}>Your business has been reported</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, we wanted to let you know that your business
  has received a report from another NepSaathi member. Our team is reviewing it.
</p>

{_listing_card(business.business_name, business_url, f"Report ID: #{report.id}", emoji="&#127981;", bg="#FFF1E0")}

{_info_box(
    "&#9989; If your business follows our community guidelines, no action will be taken "
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
            'to':      [business.owner.email],
            'subject': '[NepSaathi] Your business has been reported',
            'html':    _wrap(owner_body),
        })
    except Exception as e:
        print(f'Business report email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 10. BUSINESS CLEARED (report dismissed)
# ─────────────────────────────────────────────────────────────

def send_business_cleared_email(report):
    business = report.business
    business_url = f"{FRONTEND_URL}/businesses/{business.slug}"
    try:
        first_name = business.owner.first_name or 'there'
        body = f"""
<h1 {_H1}>Your business has been cleared &#9989;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, good news! Our team has reviewed the report on your business
  and found that it complies with our community guidelines. Your business remains active.
</p>

{_listing_card(
    business.business_name,
    business_url,
    "Status: Active &middot; No action required",
    emoji="&#127981;",
    bg="#E1F5EE"
)}

{_info_box(
    "&#9989; No action is required from you. Your business continues to be visible "
    "to the NepSaathi community.",
    bg="#E1F5EE", border="#9FE1CB", color="#085041"
)}

{_btn("View your business &rarr;", business_url, color="#1D9E75")}

{_DIVIDER}
<p {_SMALL}>
  Thank you for being a valued member of NepSaathi. If you have any questions,
  contact us at <a href="mailto:support@nepsaathi.com" style="color:#534AB7;text-decoration:none;">support@nepsaathi.com</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [business.owner.email],
            'subject': f'[NepSaathi] Your business has been reviewed and cleared — {business.business_name}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Business cleared email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 11. BUSINESS VERIFIED
# ─────────────────────────────────────────────────────────────

def send_business_verified_email(business):
    business_url = f"{FRONTEND_URL}/businesses/{business.slug}"
    try:
        first_name = business.owner.first_name or 'there'
        body = f"""
<h1 {_H1}>Your business is now verified &#9989;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, great news! Our team has reviewed and verified
  <strong>{html_module.escape(business.business_name)}</strong> on NepSaathi.
  Your business now displays a verified badge, giving customers more confidence.
</p>

{_listing_card(
    business.business_name,
    business_url,
    f"{business.get_category_display()} &middot; {business.suburb}, {business.state}",
    emoji="&#127981;",
    bg="#E1F5EE"
)}

{_info_box(
    "&#11088; Verified businesses appear higher in search results and display a trusted badge "
    "to the NepSaathi community.",
    bg="#E1F5EE", border="#9FE1CB", color="#085041"
)}

{_btn("View your business &rarr;", business_url, color="#1D9E75")}

{_DIVIDER}
<p {_SMALL}>
  Thank you for being part of NepSaathi. If you have any questions,
  contact us at <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;text-decoration:none;">hello@nepsaathi.com</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [business.owner.email],
            'subject': f'[NepSaathi] {business.business_name} is now verified!',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Business verified email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 12. BUSINESS REMOVED BY ADMIN
# ─────────────────────────────────────────────────────────────

def send_business_removed_email(business, reason=''):
    try:
        first_name = business.owner.first_name or 'there'
        safe_reason = html_module.escape(str(reason)) if reason else 'Violation of community guidelines'
        body = f"""
<h1 {_H1}>Your business has been removed</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, after reviewing your business listing, our team has
  determined that it does not comply with NepSaathi's community guidelines and has been removed.
</p>

{_info_box(
    f"<strong>Business:</strong> {html_module.escape(business.business_name)}<br>"
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
  before registering again. Thank you for your understanding.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [business.owner.email],
            'subject': f'[NepSaathi] Your business has been removed — {business.business_name}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Business removed email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 12. USER VERIFIED BY ADMIN
# ─────────────────────────────────────────────────────────────

def send_user_verified_email(user):
    try:
        first_name = user.first_name or 'there'
        body = f"""
<h1 {_H1}>Your account is now verified &#9989;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, great news! Our team has verified your NepSaathi account.
  You now have a verified badge on your profile, giving the community more confidence in you.
</p>

{_info_box(
    "&#11088; Verified accounts display a trusted badge across all your listings, "
    "businesses, and posts on NepSaathi.",
    bg="#E1F5EE", border="#9FE1CB", color="#085041"
)}

{_btn("Go to your profile &rarr;", FRONTEND_URL, color="#1D9E75")}

{_DIVIDER}
<p {_SMALL}>
  Thank you for being part of NepSaathi. If you have any questions,
  contact us at <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;text-decoration:none;">hello@nepsaathi.com</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': '[NepSaathi] Your account has been verified!',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'User verified email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 13. USER BANNED BY ADMIN
# ─────────────────────────────────────────────────────────────

def send_user_banned_email(user):
    try:
        first_name = user.first_name or 'there'
        safe_reason = html_module.escape(user.ban_reason) if user.ban_reason else 'Violation of community guidelines'
        body = f"""
<h1 {_H1}>Your account has been suspended</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, your NepSaathi account has been suspended
  following a review by our team.
</p>

{_info_box(
    f"<strong>Reason:</strong> {safe_reason}",
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
  for more information. Thank you for your understanding.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': '[NepSaathi] Your account has been suspended',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'User banned email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 14. LISTING RENEWED
# ─────────────────────────────────────────────────────────────

def send_listing_renewed_email(listing):
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/{listing.slug}"
    my_listings_url = f"{FRONTEND_URL}/my-listings"
    try:
        first_name = listing.user.first_name or 'there'
        expires_at = listing.expires_at.strftime('%d %B %Y')
        body = f"""
<h1 {_H1}>Your listing has been renewed &#128260;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, your listing has been successfully renewed
  and is now live for another 30 days.
</p>

{_listing_card(
    listing.title,
    listing_url,
    f"Active until: {expires_at}",
    bg="#E1F5EE"
)}

{_info_box(
    f"&#9989; Your listing is live and visible to the NepSaathi community until <strong>{expires_at}</strong>. "
    "We'll remind you again 3 days before it expires.",
    bg="#E1F5EE", border="#9FE1CB", color="#085041"
)}

{_btn("View your listing &rarr;", listing_url, color="#1D9E75")}

{_DIVIDER}
<p {_SMALL}>
  Manage all your listings at
  <a href="{my_listings_url}" style="color:#534AB7;text-decoration:none;">My Listings</a>.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [listing.user.email],
            'subject': f'[NepSaathi] Your listing has been renewed — {listing.title}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Listing renewed email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 15. LISTING EXPIRED
# ─────────────────────────────────────────────────────────────

def send_saved_search_alert_email(user, listing, saved_search_id):
    listing_type = listing.listing_type
    listing_url = f"{FRONTEND_URL}/{listing_type}s/{listing.slug}"
    manage_url = f"{FRONTEND_URL}/saved-searches"
    type_labels = {
        'job': ('Job', '&#128188;', '#EEEDFE'),
        'room': ('Room', '&#127968;', '#FFF1E0'),
        'event': ('Event', '&#127881;', '#E1F5EE'),
        'notice': ('Notice', '&#128226;', '#F5F4F0'),
    }
    label, emoji, bg = type_labels.get(listing_type, ('Listing', '&#128204;', '#EEEDFE'))
    try:
        first_name = user.first_name or 'there'
        body = f"""
<h1 {_H1}>New {label} matching your saved search &#128276;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, a new {label.lower()} has been posted that matches
  one of your saved searches on NepSaathi.
</p>

{_listing_card(
    html_module.escape(listing.title),
    listing_url,
    html_module.escape(listing.location or listing.state or 'Australia'),
    emoji=emoji,
    bg=bg
)}

{_btn(f"View {label} &rarr;", listing_url, color="#534AB7")}

{_DIVIDER}
<p {_SMALL}>
  You're receiving this because you saved a search alert on NepSaathi.
  <a href="{manage_url}" style="color:#534AB7;text-decoration:none;">Manage your saved searches</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': f'[NepSaathi] New {label}: {listing.title}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Saved search alert email failed: {e}', flush=True)


def send_business_saved_search_alert_email(user, business, saved_search_id):
    business_url = f"{FRONTEND_URL}/businesses/{business.slug}"
    manage_url = f"{FRONTEND_URL}/saved-searches"
    try:
        first_name = user.first_name or 'there'
        body = f"""
<h1 {_H1}>New business matching your saved search &#128276;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, a new business has been listed on NepSaathi
  that matches one of your saved searches.
</p>

{_listing_card(
    html_module.escape(business.business_name),
    business_url,
    html_module.escape(f"{business.suburb}, {business.state}"),
    emoji="&#127981;",
    bg="#FFF1E0"
)}

{_btn("View Business &rarr;", business_url, color="#8B5E00")}

{_DIVIDER}
<p {_SMALL}>
  You're receiving this because you saved a business search alert on NepSaathi.
  <a href="{manage_url}" style="color:#534AB7;text-decoration:none;">Manage your saved searches</a>
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': f'[NepSaathi] New business: {business.business_name}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Business saved search alert email failed: {e}', flush=True)


def send_payment_invoice_email(payment):
    from payments.pdf import generate_invoice_pdf
    listing = payment.listing
    listing_url = f"{FRONTEND_URL}/{listing.listing_type}s/{listing.slug}"
    try:
        first_name = payment.user.first_name or 'there'
        invoice_number = f"INV-{payment.id:05d}"
        amount_aud = payment.amount_paid / 100
        date_paid = payment.completed_at.strftime('%d %B %Y')
        featured_until = (payment.completed_at + timedelta(days=payment.duration_days)).strftime('%d %B %Y')
        ref = payment.stripe_session_id[:32] + '...'
        pdf_bytes = generate_invoice_pdf(payment)

        body = f"""
<h1 {_H1}>Payment confirmed &#9989;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, thank you for your payment!
  Your listing is now featured and will appear at the top of search results.
</p>

<!-- PAID badge + invoice number -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td bgcolor="#E1F5EE" style="background-color:#E1F5EE !important;border-radius:6px;padding:5px 14px;">
            <span style="font-size:12px;font-weight:700;color:#085041;font-family:Arial,sans-serif;letter-spacing:0.06em;">&#9989;&nbsp; PAID</span>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <span style="font-size:13px;color:#888888;font-family:Arial,sans-serif;">{invoice_number} &middot; {date_paid}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Invoice table -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">
  <!-- Header -->
  <tr>
    <td colspan="2" bgcolor="#F5F4F0" style="background-color:#F5F4F0 !important;padding:11px 16px;border-bottom:1px solid #e8e8e8;">
      <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.07em;font-family:Arial,sans-serif;">Invoice</span>
    </td>
  </tr>
  <!-- Line item -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff !important;padding:16px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
      <div style="font-size:14px;font-weight:700;color:#26215C;font-family:Arial,sans-serif;margin-bottom:4px;">
        &#11088; Featured Listing &mdash; {payment.duration_days} days
      </div>
      <div style="font-size:12px;color:#888888;font-family:Arial,sans-serif;">{html_module.escape(listing.title)}</div>
    </td>
    <td bgcolor="#ffffff" style="background-color:#ffffff !important;padding:16px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:middle;white-space:nowrap;">
      <span style="font-size:14px;font-weight:700;color:#26215C;font-family:Arial,sans-serif;">AUD ${amount_aud:.2f}</span>
    </td>
  </tr>
  <!-- Total -->
  <tr>
    <td bgcolor="#EEEDFE" style="background-color:#EEEDFE !important;padding:13px 16px;">
      <span style="font-size:13px;font-weight:700;color:#3C3489;font-family:Arial,sans-serif;">Total paid</span>
    </td>
    <td bgcolor="#EEEDFE" style="background-color:#EEEDFE !important;padding:13px 16px;text-align:right;">
      <span style="font-size:16px;font-weight:700;color:#26215C;font-family:Arial,sans-serif;">AUD ${amount_aud:.2f}</span>
    </td>
  </tr>
</table>

{_info_box(
    f"&#11088; Your listing is now featured and will be highlighted to all visitors until <strong>{featured_until}</strong>. "
    "It will appear at the top of relevant search results for the full duration.",
    bg="#E1F5EE", border="#9FE1CB", color="#085041"
)}

{_listing_card(
    html_module.escape(listing.title),
    listing_url,
    f"&#11088; Featured &middot; Active until {featured_until}",
    emoji="&#11088;",
    bg="#E1F5EE"
)}

{_btn("View your featured listing &rarr;", listing_url, color="#1D9E75")}

{_DIVIDER}
<p style="font-size:12px;color:#aaaaaa;margin:0 0 6px;font-family:Arial,sans-serif;">
  <strong style="color:#888888;">Payment reference:</strong>&nbsp; {ref}
</p>
<p style="font-size:12px;color:#aaaaaa;margin:0;font-family:Arial,sans-serif;">
  Questions? Email us at&nbsp;
  <a href="mailto:hello@nepsaathi.com" style="color:#534AB7;text-decoration:none;">hello@nepsaathi.com</a>
</p>"""

        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [payment.user.email],
            'subject': f'Payment receipt {invoice_number} — NepSaathi',
            'html':    _wrap(body),
            'attachments': [
                {'filename': f'{invoice_number}.pdf', 'content': pdf_bytes, 'content_type': 'application/pdf'},
            ],
        })
    except Exception as e:
        print(f'Invoice email failed: {e}', flush=True)


def send_spam_detected_email(listing, reason):
    admin_url_for_listing = f"{ADMIN_URL}/listings/listing/{listing.id}/change/"
    reason_text = {
        'phone_match': 'Phone number matches an existing listing from a different account.',
        'image_hash':  'Image hash matches an image used in a different account\'s listing.',
    }.get(reason, reason)
    try:
        body = f"""
<h1 {_H1}>&#9888; Duplicate listing detected — action required</h1>
<p {_P}>
  A listing was automatically flagged and hidden from public view because
  it matched an existing listing from a different account. Please review
  it in the admin panel and either approve or remove it.
</p>

{_listing_card(
    html_module.escape(listing.title),
    admin_url_for_listing,
    f"Posted by: {listing.user.email} &middot; Type: {listing.listing_type}",
    emoji="&#9888;",
    bg="#FCEBEB"
)}

{_info_box(
    f"<strong>Detection reason:</strong> {reason_text}<br>"
    f"<strong>Status:</strong> Hidden from public (is_under_review = True)",
    bg="#FCEBEB", border="#F09595", color="#A32D2D"
)}

{_btn("Review in admin panel &rarr;", admin_url_for_listing, color="#26215C")}

{_DIVIDER}
<p {_SMALL}>This is an automated message from NepSaathi spam detection.</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      ['support@nepsaathi.com'],
            'subject': f'[URGENT] Duplicate listing flagged — {listing.title}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Spam detected email failed: {e}', flush=True)


def send_listing_expired_email(listing):
    my_listings_url = f"{FRONTEND_URL}/my-listings"
    try:
        first_name = listing.user.first_name or 'there'
        body = f"""
<h1 {_H1}>Your listing has expired &#9201;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, your listing has expired and is no longer visible
  to the NepSaathi community. You can repost it for free from My Listings.
</p>

{_listing_card(
    listing.title,
    my_listings_url,
    "Status: Expired",
    bg="#FFF1E0"
)}

{_info_box(
    "&#128260; Reposting is completely free and takes just one click. "
    "Your listing will be live again for another 30 days.",
    bg="#FFF1E0", border="#EFD9C0", color="#633806"
)}

{_btn("Repost my listing &rarr;", my_listings_url, color="#E87722")}

{_DIVIDER}
<p {_SMALL}>
  Go to <a href="{my_listings_url}" style="color:#534AB7;text-decoration:none;">My Listings</a>
  to manage all your posts.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [listing.user.email],
            'subject': f'[NepSaathi] Your listing has expired — {listing.title}',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Listing expired email failed: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# 14. EVENT RSVP REMINDER
# ─────────────────────────────────────────────────────────────

def send_event_reminder_email(user, event):
    event_url = f"{FRONTEND_URL}/events/{event.listing.slug}"
    try:
        first_name = user.first_name or 'there'
        event_date_str = event.event_date.strftime('%A, %d %B %Y at %I:%M %p')
        venue_str = event.venue if event.venue else ('Online' if event.is_online else 'TBA')
        body = f"""
<h1 {_H1}>Your event is tomorrow! &#127881;</h1>
<p {_P}>
  Hi <strong>{first_name}</strong>, just a friendly reminder that you're attending an event tomorrow.
  Here are the details:
</p>

{_listing_card(
    event.listing.title,
    event_url,
    f"{event_date_str} &middot; {venue_str}",
    emoji="&#127881;",
    bg="#EEEDFE"
)}

{_info_box(
    f"&#128205; Venue: {venue_str}<br>"
    + (f"&#127760; Online: <a href='{event.event_url}' style='color:#534AB7;'>{event.event_url}</a><br>" if event.is_online and event.event_url else "")
    + f"&#127903; Ticket: {event.ticket_display}",
    bg="#EEEDFE", border="#AFA9EC", color="#3C3489"
)}

{_btn("View event details &rarr;", event_url, color="#534AB7")}

{_DIVIDER}
<p {_SMALL}>
  You received this because you RSVP'd to this event on NepSaathi.
</p>"""
        _fire({
            'from':    'NepSaathi <noreply@nepsaathi.com>',
            'to':      [user.email],
            'subject': f'[NepSaathi] Reminder: {event.listing.title} is tomorrow!',
            'html':    _wrap(body),
        })
    except Exception as e:
        print(f'Event reminder email failed: {e}', flush=True)