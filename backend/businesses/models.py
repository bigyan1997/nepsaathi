from django.db import models
from django.conf import settings


class Business(models.Model):
    """
    Nepalese business listings for NepSaathi.
    Unlike jobs/rooms/events, businesses are standalone
    — they don't link to the base Listing model.
    They have their own profile that persists long term.

    Security:
    - owner field links to User model
    - is_verified only set by admin
    - ABN stored but not publicly displayed
    """

    class Category(models.TextChoices):
        RESTAURANT = 'restaurant', 'Restaurant & Cafe'
        GROCERY = 'grocery', 'Grocery & Food Store'
        TRAVEL = 'travel', 'Travel & Tourism'
        BEAUTY = 'beauty', 'Beauty & Salon'
        HEALTH = 'health', 'Health & Medical'
        LEGAL = 'legal', 'Legal & Accounting'
        EDUCATION = 'education', 'Education & Tutoring'
        RELIGIOUS = 'religious', 'Religious Services'
        CONSTRUCTION = 'construction', 'Construction & Trade'
        TRANSPORT = 'transport', 'Transport & Logistics'
        FINANCE = 'finance', 'Finance & Money Transfer'
        FREELANCER = 'freelancer', 'Freelancer & Pujari'
        RETAIL = 'retail', 'Retail & Shopping'
        OTHER = 'other', 'Other'

    class State(models.TextChoices):
        NSW = 'NSW', 'New South Wales'
        VIC = 'VIC', 'Victoria'
        QLD = 'QLD', 'Queensland'
        WA = 'WA', 'Western Australia'
        SA = 'SA', 'South Australia'
        TAS = 'TAS', 'Tasmania'
        ACT = 'ACT', 'Australian Capital Territory'
        NT = 'NT', 'Northern Territory'

    # Owner
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='businesses',
        help_text='The user who registered this business'
    )

    # Business details
    business_name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    description = models.TextField(
        help_text='About the business'
    )
    is_nepalese_owned = models.BooleanField(
        default=True,
        help_text='Is this business owned by a Nepalese person?'
    )

    # Location
    address = models.CharField(max_length=300, blank=True)
    suburb = models.CharField(max_length=100)
    state = models.CharField(
        max_length=10,
        choices=State.choices,
        default=State.NSW,
    )
    postcode = models.CharField(max_length=10, blank=True)

    # Contact
    phone = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Business info
    abn = models.CharField(
        max_length=20,
        blank=True,
        help_text='Australian Business Number — kept private'
    )
    established_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Year the business was established'
    )
    operating_hours = models.TextField(
        blank=True,
        help_text='e.g. Mon-Fri 9am-5pm, Sat 10am-3pm'
    )

    # Status
    is_verified = models.BooleanField(
        default=False,
        help_text='Verified by NepSaathi admin'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Is the business currently active?'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'businesses'
        verbose_name = 'Business'
        verbose_name_plural = 'Businesses'
        ordering = ['-is_verified', '-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['state']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_active']),
            models.Index(fields=['owner']),
        ]

    def __str__(self):
        return f'{self.business_name} ({self.get_category_display()}) — {self.suburb}'


class BusinessReport(models.Model):
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
        related_name='business_reports',
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='reports',
    )
    reason = models.CharField(max_length=20, choices=Reason.choices, default=Reason.SPAM)
    details = models.TextField(blank=True)
    is_reviewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'business_reports'
        unique_together = ('user', 'business')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} reported {self.business.business_name} ({self.reason})'


class BusinessReview(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_reviews',
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
    )
    comment = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'business_reviews'
        unique_together = ('business', 'reviewer')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reviewer} → {self.business.business_name} ({self.rating}★)'