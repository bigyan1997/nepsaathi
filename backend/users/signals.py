import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User


@receiver(post_save, sender=User)
def send_welcome_on_create(sender, instance, created, **kwargs):
    """Send welcome email when a new user is created."""
    if created and instance.email:
        def send():
            try:
                from core.emails import send_welcome_email
                send_welcome_email(instance)
            except Exception as e:
                print(f'Welcome email signal failed: {e}')
        thread = threading.Thread(target=send)
        thread.start()