from django.core.management.base import BaseCommand
from users.models import PushSubscription


class Command(BaseCommand):
    help = 'Delete all push subscriptions (use after rotating VAPID keys)'

    def handle(self, *args, **options):
        count, _ = PushSubscription.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {count} push subscription(s).'))
