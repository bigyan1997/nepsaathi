from django.core.management.base import BaseCommand
from django.utils import timezone
from businesses.models import Business


class Command(BaseCommand):
    help = 'Clear is_featured on businesses whose featured_until has passed'

    def handle(self, *args, **options):
        now = timezone.now()
        expired = Business.objects.filter(is_featured=True, featured_until__lt=now)
        count = expired.count()
        if count == 0:
            self.stdout.write('No featured businesses to expire.')
            return
        expired.update(is_featured=False)
        self.stdout.write(self.style.SUCCESS(f'Expired featured status for {count} businesses.'))
