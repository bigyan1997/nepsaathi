from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from events.models import EventRSVP
import zoneinfo


class Command(BaseCommand):
    help = 'Send reminder emails and push notifications to users RSVPd to events tomorrow'

    def handle(self, *args, **kwargs):
        sydney_tz = zoneinfo.ZoneInfo('Australia/Sydney')
        now_sydney = timezone.now().astimezone(sydney_tz)

        # Window: events starting between 20h and 28h from now (catches "tomorrow" broadly)
        window_start = timezone.now() + timedelta(hours=20)
        window_end = timezone.now() + timedelta(hours=28)

        rsvps = (
            EventRSVP.objects
            .select_related('event__listing', 'user')
            .filter(
                event__event_date__range=(window_start, window_end),
                event__listing__status='active',
            )
        )

        self.stdout.write(f'Found {rsvps.count()} RSVPs for events in the next 20-28 hours...')

        for rsvp in rsvps:
            event = rsvp.event
            user = rsvp.user
            try:
                from core.emails import send_event_reminder_email
                from core.push import send_push_notification
                send_event_reminder_email(user, event)
                send_push_notification(
                    user,
                    'Event reminder',
                    f'"{event.listing.title}" is tomorrow! Tap to view details.',
                    f'/events/{event.listing.slug}',
                )
                self.stdout.write(f'  ✓ Reminded {user.email} about: {event.listing.title}')
            except Exception as e:
                self.stdout.write(f'  ✗ Failed for {user.email} / {event.listing.title}: {e}')

        self.stdout.write('Done.')
