from django.db import models
from django.conf import settings
from django.utils.text import slugify
import uuid


class ForumPost(models.Model):
    class Category(models.TextChoices):
        # Community-intent tags (new)
        DISCUSSION = 'discussion', 'Discussion'
        LOOKING_FOR = 'looking_for', 'Looking For'
        ANNOUNCEMENT = 'announcement', 'Announcement'
        BUY_SELL = 'buy_sell', 'Buy / Sell'
        WARNING = 'warning', 'Warning'
        # Topic tags (existing — kept for backwards compat)
        VISA = 'visa', 'Visa & Immigration'
        ACCOMMODATION = 'accommodation', 'Accommodation'
        JOBS = 'jobs', 'Jobs & Work'
        EVENTS = 'events', 'Events'
        BUSINESS = 'business', 'Business'
        GENERAL = 'general', 'General'

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='forum_posts'
    )
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.DISCUSSION, db_index=True)
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=5000)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    is_pinned = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    upvotes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='upvoted_posts',
        blank=True
    )
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'forum_posts'
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:220] or 'post'
            candidate = f"{base}-{uuid.uuid4().hex[:12]}"
            while ForumPost.objects.filter(slug=candidate).exists():
                candidate = f"{base}-{uuid.uuid4().hex[:12]}"
            self.slug = candidate
        super().save(*args, **kwargs)

    @property
    def upvote_count(self):
        return self.upvotes.count()

    @property
    def reply_count(self):
        return self.replies.count()


class PollOption(models.Model):
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='poll_options')
    text = models.CharField(max_length=200)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'forum_poll_options'
        ordering = ['order']

    def __str__(self):
        return f'{self.post.title} — {self.text}'


class PollVote(models.Model):
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='votes')
    voter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='poll_votes')
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'forum_poll_votes'
        unique_together = [('voter', 'option')]


class ForumReply(models.Model):
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='forum_replies'
    )
    body = models.TextField(max_length=2000)
    upvotes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='upvoted_replies',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'forum_replies'
        ordering = ['created_at']

    def __str__(self):
        return f'Reply by {self.author} on {self.post}'

    @property
    def upvote_count(self):
        return self.upvotes.count()
