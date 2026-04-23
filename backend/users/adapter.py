from allauth.account.adapter import DefaultAccountAdapter
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom adapter to send password reset via Resend."""

    def send_mail(self, template_prefix, email, context):
        if template_prefix == 'account/email/password_reset_key':
            try:
                user = context.get('user')
                reset_url = context.get('password_reset_url', '')
                from core.emails import send_password_reset_email
                send_password_reset_email(user, reset_url)
                return
            except Exception as e:
                print(f'Password reset email failed: {e}', flush=True)
        super().send_mail(template_prefix, email, context)

    def send_password_reset_mail(self, user, email, context):
        reset_url = context.get('password_reset_url', '')
        try:
            from core.emails import send_password_reset_email
            send_password_reset_email(user, reset_url)
        except Exception as e:
            print(f'Password reset email failed: {e}', flush=True)
            super().send_password_reset_mail(user, email, context)