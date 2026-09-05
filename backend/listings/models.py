from django.db import models
from django.conf import settings
from django.utils.text import slugify
from cloudinary.models import CloudinaryField
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
import cloudinary.uploader
from uuid import uuid4

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
        NOTICE = 'notice', 'Notice'

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
        help_text='Type of listing: job, room, event, business or notice'
    )

    # Core fields
    title = models.CharField(max_length=200)
    description = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    location = models.CharField(
        max_length=200,
        help_text='Suburb or city e.g. Parramatta, Sydney'
    )
    state = models.CharField(
        max_length=10,
        choices=State.choices,
        default=State.NSW,
    )
    postcode = models.CharField(max_length=10, blank=True)

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
    featured_until = models.DateTimeField(
        null=True, blank=True,
        help_text='When the featured period ends; None means not currently featured via payment'
    )
    is_under_review = models.BooleanField(default=False)
    renewal_blocked = models.BooleanField(
        default=False,
        help_text='Admin can block this listing from being renewed'
    )
    is_admin_removed = models.BooleanField(
        default=False,
        help_text='Set to True only when an admin explicitly removes the listing — used for violation tracking'
    )
    is_wanted = models.BooleanField(
        default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    expiry_warning_sent = models.BooleanField(default=False)
    featured_warning_sent = models.BooleanField(default=False)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    slug = models.SlugField(max_length=255, unique=True, blank=True, db_index=True)

    # Full-text search vector — weighted combination of title (A), location (B), description (C).
    # Updated automatically via post_save signal in listings/signals.py.
    search_vector = SearchVectorField(null=True, blank=True)

    class Meta:
        db_table = 'listings'
        ordering = ['-created_at']
        verbose_name = 'Listing'
        verbose_name_plural = 'Listings'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['listing_type']),
            models.Index(fields=['state']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['-created_at']),
            GinIndex(fields=['search_vector'], name='listing_search_vector_gin'),
        ]

    def __str__(self):
        return f'{self.listing_type.upper()} — {self.title} ({self.location})'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or 'listing'
            candidate = f"{base}-{uuid4().hex[:8]}"
            while Listing.objects.filter(slug=candidate).exists():
                candidate = f"{base}-{uuid4().hex[:8]}"
            self.slug = candidate
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Override delete to remove all Cloudinary images
        before deleting the listing from the database.
        This frees up Cloudinary storage space.
        """
        # Delete all images from Cloudinary first
        for image in self.images.all():
            image.delete()
        super().delete(*args, **kwargs)


class ListingImage(models.Model):
    """
    Images attached to a listing.
    Stored on Cloudinary CDN for fast delivery.
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = CloudinaryField('image', folder='nepsaathi/listings/')
    is_primary = models.BooleanField(
        default=False,
        help_text='Primary image shown as the listing thumbnail'
    )
    image_hash = models.CharField(
        max_length=32,
        blank=True,
        db_index=True,
        help_text='MD5 hash of image bytes — used for cross-user duplicate detection'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_images'

    def __str__(self):
        return f'Image for {self.listing.title}'
    
    def delete(self, *args, **kwargs):
        """
        Override delete to remove the image from Cloudinary
        before deleting the database record.
        This frees up Cloudinary storage.
        """
        try:
            # Get the Cloudinary public_id from the image field
            public_id = self.image.public_id
            if public_id:
                cloudinary.uploader.destroy(public_id)
        except Exception:
            # Don't block deletion if Cloudinary fails
            pass
        super().delete(*args, **kwargs)
    
class SavedListing(models.Model):
    """
    Allows users to bookmark/save listings they like.
    One save per user per listing.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_listings'
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_listings'
        unique_together = ('user', 'listing')
        ordering = ['-saved_at']

    def __str__(self):
        return f'{self.user.email} saved {self.listing.title}'

class ListingReport(models.Model):
    """
    Allows users to report spam, fake or inappropriate listings.
    Admin can review and take action.
    """

    class Reason(models.TextChoices):
        SPAM = 'spam', 'Spam or duplicate'
        FAKE = 'fake', 'Fake or misleading'
        INAPPROPRIATE = 'inappropriate', 'Inappropriate content'
        SCAM = 'scam', 'Scam or fraud'
        WRONG_CATEGORY = 'wrong_category', 'Wrong category'
        OTHER = 'other', 'Other'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    reason = models.CharField(
        max_length=20,
        choices=Reason.choices,
        default=Reason.SPAM,
    )
    details = models.TextField(
        blank=True,
        help_text='Additional details about the report'
    )
    is_reviewed = models.BooleanField(
        default=False,
        help_text='Has admin reviewed this report?'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_reports'
        unique_together = ('user', 'listing')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} reported {self.listing.title} — {self.reason}'

class ListingView(models.Model):
    """Tracks unique views per listing."""
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name='views'
    )
    user = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='listing_views'
    )
    ip_address = models.GenericIPAddressField()
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_views'
        indexes = [
            models.Index(fields=['listing', 'user']),
            models.Index(fields=['listing', 'ip_address']),
        ]

class SavedSearch(models.Model):
    """Stores a user's saved search filters to trigger email alerts on new matches."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_searches",
    )
    label = models.CharField(max_length=100, blank=True)
    listing_type = models.CharField(max_length=20)
    filters = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    last_notified = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_searches"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.listing_type} search"
