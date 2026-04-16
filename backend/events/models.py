from django.db import models
from django.utils import timezone
from listings.models import Listing


class Event(models.Model):
    """
    Event-specific details for a NepSaathi listing.
    """
    class EventCategory(models.TextChoices):
        CULTURAL = 'cultural', 'Cultural'
        SPORTS = 'sports', 'Sports'
        FOOD = 'food', 'Food & Dining'
        MUSIC = 'music', 'Music & Entertainment'
        RELIGIOUS = 'religious', 'Religious'
        COMMUNITY = 'community', 'Community Meetup'
        EDUCATION = 'education', 'Education & Workshop'
        OTHER = 'other', 'Other'

    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name='event_detail'
    )
    category = models.CharField(
        max_length=20,
        choices=EventCategory.choices,
        default=EventCategory.COMMUNITY,
    )
    event_date = models.DateTimeField(
        help_text='Date and time the event starts'
    )
    event_end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date and time the event ends'
    )
    venue = models.CharField(
        max_length=300,
        blank=True,
        help_text='Full venue address'
    )
    organiser = models.CharField(
        max_length=200,
        blank=True,
        help_text='Name of the organising person or group'
    )
    is_free = models.BooleanField(
        default=True,
        help_text='Is this event free to attend?'
    )
    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Ticket price in AUD — leave empty if free'
    )
    max_attendees = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Maximum number of attendees'
    )
    is_online = models.BooleanField(
        default=False,
        help_text='Is this a virtual/online event?'
    )
    event_url = models.URLField(
        blank=True,
        help_text='Link to event page, tickets or registration'
    )

    class Meta:
        db_table = 'events'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['event_date']

    def __str__(self):
        return f'{self.listing.title} — {self.event_date.strftime("%d %b %Y")}'

    @property
    def ticket_display(self):
        if self.is_free:
            return 'Free'
        if self.ticket_price:
            return f'${self.ticket_price:,.2f}'
        return 'Contact for price'

    @property
    def is_upcoming(self):
        return self.event_date >= timezone.now()