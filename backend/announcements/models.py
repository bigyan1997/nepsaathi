from django.db import models
from listings.models import Listing


class Announcement(models.Model):
    """
    Announcement-specific details for a NepSaathi listing.
    """
    class Category(models.TextChoices):
        NEWS = 'news', 'Community News'
        SALE = 'sale', 'Item for Sale'
        SERVICE = 'service', 'Service Offered'
        GENERAL = 'general', 'General'
        LOST_FOUND = 'lost_found', 'Lost & Found'
        EDUCATION = 'education', 'Education'

    class Condition(models.TextChoices):
        NEW = 'new', 'Brand New'
        LIKE_NEW = 'like_new', 'Like New'
        GOOD = 'good', 'Good'
        FAIR = 'fair', 'Fair'
        POOR = 'poor', 'Poor'
        NOT_APPLICABLE = 'na', 'Not Applicable'

    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name='announcement_detail'
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
        help_text='Category of the announcement'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Price in AUD — only for sale items'
    )
    condition = models.CharField(
        max_length=20,
        choices=Condition.choices,
        default=Condition.NOT_APPLICABLE,
        help_text='Condition of item — only for sale items'
    )
    is_free = models.BooleanField(
        default=False,
        help_text='Is this item or service free?'
    )
    is_urgent = models.BooleanField(
        default=False,
        help_text='Mark as urgent to highlight the announcement'
    )

    class Meta:
        db_table = 'announcements'
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

    def __str__(self):
        return f'{self.get_category_display()} — {self.listing.title}'

    @property
    def price_display(self):
        if self.is_free:
            return 'Free'
        if self.price:
            return f'${self.price:,.2f}'
        return 'Contact for price'