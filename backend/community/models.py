from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class ReverseRequest(models.Model):
    CATEGORY_CHOICES = [
        ('job',      'Looking for Work'),
        ('room',     'Looking for Room'),
        ('services', 'Looking for Services'),
        ('other',    'Other'),
    ]
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reverse_requests')
    title    = models.CharField(max_length=200)
    body     = models.TextField(max_length=2000)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    state    = models.CharField(max_length=50, blank=True)
    budget   = models.CharField(max_length=100, blank=True)
    contact  = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reverse_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email}: {self.title}'


class ServiceListing(models.Model):
    RATE_TYPE_CHOICES = [
        ('hourly',     'Per Hour'),
        ('fixed',      'Fixed Price'),
        ('negotiable', 'Negotiable'),
    ]
    CATEGORY_CHOICES = [
        ('tutoring',    'Tutoring / Teaching'),
        ('translation', 'Translation / Interpretation'),
        ('it',          'IT & Tech'),
        ('photography', 'Photography / Video'),
        ('cooking',     'Cooking / Events'),
        ('accounting',  'Accounting / Tax'),
        ('transport',   'Transport / Delivery'),
        ('cleaning',    'Cleaning'),
        ('other',       'Other'),
    ]
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_listings')
    title       = models.CharField(max_length=200)
    category    = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    description = models.TextField(max_length=2000)
    rate        = models.CharField(max_length=100, blank=True)
    rate_type   = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, default='negotiable')
    location    = models.CharField(max_length=100, blank=True)
    state       = models.CharField(max_length=50, blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'service_listings'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email}: {self.title}'
