import threading
from django.dispatch import receiver
from allauth.account.signals import email_confirmed


@receiver(email_confirmed)
def send_welcome_on_verify(sender, request, email_address, **kwargs):
    """Send welcome email after the user verifies their email address."""
    user = email_address.user
    if user and user.email:
        def send():
            try:
                from core.emails import send_welcome_email
                send_welcome_email(user)
            except Exception as e:
                print(f'Welcome email signal failed: {e}')
        thread = threading.Thread(target=send)
        thread.start()