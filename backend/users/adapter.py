from allauth.account.adapter import DefaultAccountAdapter
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom adapter to send password reset via Resend."""

    def send_password_reset_mail(self, user, email, context):
        """Send password reset email via Resend instead of Django SMTP."""
        try:
            # Extract reset URL from context
            reset_url = context.get('password_reset_url') or context.get('url', '')
            from core.emails import send_password_reset_email
            send_password_reset_email(user, reset_url)
        except Exception as e:
            print(f'Password reset email failed: {e}', flush=True)
            # Fallback to default
            super().send_password_reset_mail(user, email, context)