from django.db import models
from django.conf import settings

REASON_CHOICES = [
    ('not_enough_listings', 'Not enough listings in my area'),
    ('hard_to_navigate', 'Hard to navigate'),
    ('just_browsing', 'Just browsing'),
    ('missing_feature', 'Missing a feature'),
    ('technical_issue', 'Technical issue'),
    ('other', 'Other'),
]


class FeedbackResponse(models.Model):
    satisfaction = models.PositiveSmallIntegerField()
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    page_url = models.CharField(max_length=500, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='feedback_responses',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback_responses'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.satisfaction}/5 — {self.get_reason_display()} ({self.created_at.date()})"
