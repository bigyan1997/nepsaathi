import secrets
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class User(AbstractUser):
    """
    Custom user model for NepSaathi.
    Email is the only identifier — username is removed completely.
    """
    # Remove username field entirely
    username = None

    email = models.EmailField(unique=True)

    # Profile picture — either uploaded or from Google
    avatar = models.URLField(
        blank=True,
        default='',
        help_text='Custom uploaded profile picture URL'
    )
    google_avatar = models.URLField(
        blank=True,
        help_text='Google profile picture URL — set automatically on Google login'
    )

    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    is_verified = models.BooleanField(
        default=False,
        help_text='Verified by NepSaathi admin'
    )
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True)

    # Points & referral
    points = models.PositiveIntegerField(default=0)
    referral_code = models.CharField(max_length=12, unique=True, blank=True)
    referred_by = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='referrals'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = secrets.token_urlsafe(8)[:12]
        super().save(*args, **kwargs)

    def award_points(self, delta, event_type, description):
        self.points = models.F('points') + delta
        self.save(update_fields=['points'])
        PointEvent.objects.create(
            user=self, event_type=event_type, delta=delta, description=description
        )
        self.refresh_from_db(fields=['points'])

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()


class UserReview(models.Model):
    reviewer = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='reviews_given'
    )
    reviewed_user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='reviews_received'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )  # 1–5
    comment = models.TextField(blank=True, max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_reviews'
        unique_together = ('reviewer', 'reviewed_user')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reviewer} → {self.reviewed_user} ({self.rating}★)'


class PointEvent(models.Model):
    SIGNUP      = 'signup'
    POST_AD     = 'post_ad'
    REFERRAL    = 'referral'
    PROFILE     = 'profile_complete'

    user        = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='point_events')
    event_type  = models.CharField(max_length=50)
    delta       = models.IntegerField()
    description = models.CharField(max_length=200)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'point_events'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} +{self.delta} ({self.event_type})'


class PushSubscription(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'push_subscriptions'

    def __str__(self):
        return f'{self.user.email} — {self.endpoint[:60]}'