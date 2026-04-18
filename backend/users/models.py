from django.contrib.auth.models import AbstractUser
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

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()