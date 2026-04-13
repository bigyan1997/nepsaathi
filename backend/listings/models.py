from django.db import models
from django.conf import settings


class Listing(models.Model):
    """
    Base listing model for NepSaathi.
    All content types (jobs, rooms, events, businesses)
    share these common fields.
    """

    class ListingType(models.TextChoices):
        JOB = 'job', 'Job'
        ROOM = 'room', 'Room'
        EVENT = 'event', 'Event'
        BUSINESS = 'business', 'Business'
        ANNOUNCEMENT = 'announcement', 'Announcement'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXPIRED = 'expired', 'Expired'
        FILLED = 'filled', 'Filled'
        DELETED = 'deleted', 'Deleted'

    class State(models.TextChoices):
        NSW = 'NSW', 'New South Wales'
        VIC = 'VIC', 'Victoria'
        QLD = 'QLD', 'Queensland'
        WA = 'WA', 'Western Australia'
        SA = 'SA', 'South Australia'
        TAS = 'TAS', 'Tasmania'
        ACT = 'ACT', 'Australian Capital Territory'
        NT = 'NT', 'Northern Territory'

    # Who posted it
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings',
        help_text='The user who posted this listing'
    )

    # What type of listing
    listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices,
        help_text='Type of listing: job, room, event, business or announcement'
    )

    # Core fields
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(
        max_length=200,
        help_text='Suburb or city e.g. Parramatta, Sydney'
    )
    state = models.CharField(
        max_length=10,
        choices=State.choices,
        default=State.NSW,
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    # Contact
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_whatsapp = models.CharField(max_length=20, blank=True)

    # Visibility
    is_featured = models.BooleanField(
        default=False,
        help_text='Featured listings appear at the top of search results'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'listings'
        ordering = ['-created_at']
        verbose_name = 'Listing'
        verbose_name_plural = 'Listings'

    def __str__(self):
        return f'{self.listing_type.upper()} — {self.title} ({self.location})'


class ListingImage(models.Model):
    """
    Images attached to a listing.
    A listing can have multiple images.
    We store them in Cloudinary (configured later).
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='listings/')
    is_primary = models.BooleanField(
        default=False,
        help_text='Primary image shown as the listing thumbnail'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_images'

    def __str__(self):
        return f'Image for {self.listing.title}'