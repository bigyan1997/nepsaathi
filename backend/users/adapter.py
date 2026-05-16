from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom adapter to send transactional emails via Resend."""

    def get_email_confirmation_url(self, request, emailconfirmation):
        key = emailconfirmation.key
        return f'{FRONTEND_URL}/verify-email?key={key}'

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
        elif template_prefix in (
            'account/email/email_confirmation_signup',
            'account/email/email_confirmation',
        ):
            try:
                user = context.get('user')
                confirm_url = context.get('activate_url', '')
                from core.emails import send_email_verification_email
                send_email_verification_email(user, email, confirm_url)
                return
            except Exception as e:
                print(f'Verification email failed: {e}', flush=True)
        super().send_mail(template_prefix, email, context)

    def send_password_reset_mail(self, user, email, context):
        reset_url = context.get('password_reset_url', '')
        try:
            from core.emails import send_password_reset_email
            send_password_reset_email(user, reset_url)
        except Exception as e:
            print(f'Password reset email failed: {e}', flush=True)
            super().send_password_reset_mail(user, email, context)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, _request, sociallogin):
        # Google always provides verified emails. If the matching local account
        # has an unverified EmailAddress, allauth's wipe_password() will silently
        # blank the password. Mark it verified here (before that check runs) so
        # users who registered with email/password can still log in either way.
        if not (sociallogin.user and sociallogin.user.pk):
            return
        from allauth.account.models import EmailAddress
        for addr in sociallogin.email_addresses:
            if not addr.verified:
                continue
            try:
                local = EmailAddress.objects.get(
                    user=sociallogin.user, email__iexact=addr.email
                )
                if not local.verified:
                    local.verified = True
                    local.save(update_fields=['verified'])
            except EmailAddress.DoesNotExist:
                pass