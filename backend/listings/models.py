from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField
import cloudinary.uploader

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
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['listing_type']),
            models.Index(fields=['state']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'{self.listing_type.upper()} — {self.title} ({self.location})'
    
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