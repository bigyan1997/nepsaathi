from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

AU_STATES = [
    ('NSW', 'New South Wales'),
    ('VIC', 'Victoria'),
    ('QLD', 'Queensland'),
    ('WA', 'Western Australia'),
    ('SA', 'South Australia'),
    ('TAS', 'Tasmania'),
    ('ACT', 'Australian Capital Territory'),
    ('NT', 'Northern Territory'),
]

VISA_TYPES = [
    ('485', 'Temporary Graduate (485)'),
    ('189', 'Skilled Independent (189)'),
    ('190', 'Skilled Nominated (190)'),
    ('491', 'Skilled Work Regional (491)'),
    ('500', 'Student (500)'),
    ('482', 'Employer Sponsored (482)'),
    ('820', 'Partner (820/801)'),
    ('other', 'Other'),
]


class VisaTimeline(models.Model):
    user          = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='visa_timelines')
    visa_type     = models.CharField(max_length=10, choices=VISA_TYPES)
    # Stored as "YYYY-MM" — month precision only, no exact dates for privacy
    lodged_month  = models.CharField(max_length=7)
    granted_month = models.CharField(max_length=7, blank=True)
    state_lodged  = models.CharField(max_length=3, choices=AU_STATES)
    occupation    = models.CharField(max_length=120, blank=True)
    anzsco_code   = models.CharField(max_length=10, blank=True)
    notes         = models.TextField(max_length=500, blank=True)
    is_granted    = models.BooleanField(default=False)
    is_approved   = models.BooleanField(default=True)  # admin can hide bad data
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'visa_timelines'
        ordering = ['-created_at']

    def __str__(self):
        granted = self.granted_month or 'pending'
        return f'{self.visa_type} — lodged {self.lodged_month} → {granted}'


class WhatsAppGroup(models.Model):
    CATEGORIES = [
        ('general',       'General Community'),
        ('students',      'Students'),
        ('jobs',          'Jobs & Work'),
        ('accommodation', 'Accommodation'),
        ('business',      'Business'),
        ('religion',      'Religion & Culture'),
        ('sports',        'Sports & Fitness'),
        ('women',         'Women'),
        ('other',         'Other'),
    ]
    name         = models.CharField(max_length=120)
    state        = models.CharField(max_length=3, choices=AU_STATES)
    city         = models.CharField(max_length=60)
    category     = models.CharField(max_length=20, choices=CATEGORIES, default='general')
    link         = models.URLField()
    member_count = models.CharField(max_length=20, blank=True, help_text='Display string, e.g. "500+"')
    description  = models.CharField(max_length=200, blank=True)
    is_verified  = models.BooleanField(default=False, help_text='Admin has confirmed this group is legitimate')
    is_active    = models.BooleanField(default=True)
    order        = models.PositiveSmallIntegerField(default=0, help_text='Lower = shown first')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'whatsapp_groups'
        ordering = ['order', '-created_at']

    def __str__(self):
        return f'{self.name} ({self.city})'


class Occupation(models.Model):
    LIST_TYPE_CHOICES = [
        ('MLTSSL', 'Medium and Long-term Strategic Skills List'),
        ('STSOL',  'Short-term Skilled Occupation List'),
        ('ROL',    'Regional Occupation List'),
        ('NONE',   'Not currently on a skilled list'),
    ]
    anzsco_code       = models.CharField(max_length=10, unique=True)
    title             = models.CharField(max_length=150)
    list_type         = models.CharField(max_length=10, choices=LIST_TYPE_CHOICES)
    eligible_visas    = models.CharField(max_length=60, blank=True, help_text='Comma-separated, e.g. "189,190,491"')
    alternative_titles = models.CharField(max_length=200, blank=True, help_text='Common job titles for this ANZSCO code')
    notes             = models.CharField(max_length=200, blank=True)
    last_updated      = models.DateField(help_text='Last verified against DOHA skilled occupation list')

    class Meta:
        db_table = 'visa_occupations'
        ordering = ['anzsco_code']

    def __str__(self):
        return f'{self.anzsco_code} – {self.title} ({self.list_type})'


class InvitationRound(models.Model):
    VISA_CHOICES = [
        ('189', 'Skilled Independent (189)'),
        ('190', 'Skilled Nominated (190)'),
        ('491', 'Skilled Work Regional (491)'),
    ]
    round_date        = models.CharField(max_length=7, help_text='YYYY-MM format')
    visa_type         = models.CharField(max_length=10, choices=VISA_CHOICES)
    lowest_score      = models.PositiveSmallIntegerField()
    invitations_issued = models.PositiveIntegerField()
    tiebreaker_date   = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'visa_invitation_rounds'
        ordering = ['-round_date', 'visa_type']
        unique_together = [('round_date', 'visa_type')]

    def __str__(self):
        return f'{self.round_date} — {self.visa_type} — {self.lowest_score} pts'
