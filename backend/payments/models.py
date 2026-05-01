from django.conf import settings
from django.db import models


class FeaturedPayment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        EXPIRED = 'expired', 'Expired'

    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.SET_NULL,
        null=True,
        related_name='featured_payments',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='featured_payments',
    )
    stripe_session_id = models.CharField(max_length=200, unique=True)
    amount_paid = models.PositiveIntegerField(help_text='Amount in cents AUD')
    duration_days = models.PositiveIntegerField(default=7)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'featured_payments'
        ordering = ['-created_at']

    def __str__(self):
        listing_title = self.listing.title if self.listing else 'deleted listing'
        return f'{listing_title} — {self.status}'
