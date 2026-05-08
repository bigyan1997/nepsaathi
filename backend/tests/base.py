"""
Shared test utilities, fixtures, and base classes for the NepSaathi API test suite.
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from businesses.models import Business
from events.models import Event, EventRSVP
from jobs.models import Job
from listings.models import Listing
from messaging.models import Conversation, Message
from rooms.models import Room
from users.models import User

# ─── Test-safe settings overrides ────────────────────────────────────────────

TEST_SETTINGS = {
    # Disable email verification so registration tests don't block
    'ACCOUNT_EMAIL_VERIFICATION': 'none',
    # DummyCache = no-op: get() always misses so throttles never fire in tests
    'CACHES': {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    },
    # Relax throttle rates for testing (throttle tests override individually)
    'REST_FRAMEWORK': {
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        ),
        'DEFAULT_PERMISSION_CLASSES': (
            'rest_framework.permissions.IsAuthenticatedOrReadOnly',
        ),
        'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
        'PAGE_SIZE': 20,
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {
            'anon': '10000/day',
            'user': '10000/day',
            'listing_create': '1000/hour',
            'business_create': '1000/hour',
            'login': '1000/day',
            'register': '1000/day',
            'password_reset': '1000/hour',
            'message_send': '1000/day',
            'saved_search_create': '1000/day',
        },
        'DEFAULT_FILTER_BACKENDS': [
            'django_filters.rest_framework.DjangoFilterBackend',
            'rest_framework.filters.SearchFilter',
            'rest_framework.filters.OrderingFilter',
        ],
    },
}


# ─── Mock Cloudinary for all tests (avoids real uploads) ─────────────────────

class FakeCloudinaryField:
    def __init__(self, *args, **kwargs):
        self.public_id = 'fake/public_id'
        self.url = 'https://res.cloudinary.com/fake/image/upload/fake.jpg'

    def __str__(self):
        return self.url


def mock_cloudinary_upload(*args, **kwargs):
    return {
        'public_id': 'fake/public_id',
        'url': 'https://res.cloudinary.com/fake/image/upload/fake.jpg',
        'secure_url': 'https://res.cloudinary.com/fake/image/upload/fake.jpg',
    }


# ─── Base test class ──────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class BaseAPITest(APITestCase):
    """Base class with helper factories and auth utilities."""

    _user_counter = 0

    @classmethod
    def _unique_email(cls, prefix='user'):
        cls._user_counter += 1
        return f'{prefix}_{cls._user_counter}@example.com'

    # ── User factories ──

    def create_user(self, email=None, password='TestPass123!', **kwargs):
        email = email or self._unique_email()
        first_name = kwargs.pop('first_name', 'Test')
        last_name = kwargs.pop('last_name', 'User')
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            **kwargs,
        )
        user.set_password(password)
        user.save()
        user._plain_password = password
        return user

    def create_staff(self, email=None, **kwargs):
        return self.create_user(email=email, is_staff=True, **kwargs)

    def create_banned_user(self, email=None, **kwargs):
        return self.create_user(email=email, is_banned=True, **kwargs)

    def authenticate(self, user=None):
        """Force-authenticate the test client as the given user."""
        if user is None:
            user = self.create_user()
        self.client.force_authenticate(user=user)
        return user

    def login_via_api(self, email, password):
        """Login through the real API endpoint; returns (access, refresh) tokens."""
        r = self.client.post('/api/auth/login/', {'email': email, 'password': password})
        return r.data.get('access'), r.data.get('refresh'), r

    # ── Listing factories ──

    def create_listing(self, user=None, listing_type=Listing.ListingType.JOB, **kwargs):
        user = user or self.create_user()
        defaults = {
            'title': 'Test Listing',
            'description': 'A test listing description.',
            'location': 'Sydney',
            'state': 'NSW',
            'listing_type': listing_type,
            'status': Listing.Status.ACTIVE,
            'contact_email': user.email,
        }
        defaults.update(kwargs)
        return Listing.objects.create(user=user, **defaults)

    def create_job(self, user=None, **kwargs):
        listing = self.create_listing(user=user, listing_type=Listing.ListingType.JOB)
        job_kwargs = {
            'company_name': 'Test Co',
            'job_type': Job.JobType.FULL_TIME,
            'salary': Decimal('25.00'),
            'salary_type': Job.SalaryType.HOURLY,
        }
        job_kwargs.update(kwargs)
        return Job.objects.create(listing=listing, **job_kwargs)

    def create_room(self, user=None, **kwargs):
        listing = self.create_listing(user=user, listing_type=Listing.ListingType.ROOM)
        room_kwargs = {
            'room_type': Room.RoomType.PRIVATE,
            'price': Decimal('200.00'),
            'furnishing': Room.FurnishingType.FURNISHED,
            'bond': Room.BondType.FOUR_WEEKS,
        }
        room_kwargs.update(kwargs)
        return Room.objects.create(listing=listing, **room_kwargs)

    def create_event(self, user=None, **kwargs):
        listing = self.create_listing(user=user, listing_type=Listing.ListingType.EVENT)
        event_kwargs = {
            'category': Event.EventCategory.COMMUNITY,
            'event_date': timezone.now() + timedelta(days=7),
            'venue': '123 Test Street, Sydney',
            'is_free': True,
        }
        event_kwargs.update(kwargs)
        return Event.objects.create(listing=listing, **event_kwargs)

    def create_business(self, user=None, **kwargs):
        user = user or self.create_user()
        defaults = {
            'business_name': 'Test Business',
            'category': Business.Category.RESTAURANT,
            'description': 'A test business description.',
            'suburb': 'Sydney',
            'state': 'NSW',
        }
        defaults.update(kwargs)
        return Business.objects.create(owner=user, **defaults)

    def create_conversation(self, user1=None, user2=None, listing=None):
        user1 = user1 or self.create_user()
        user2 = user2 or self.create_user()
        conv = Conversation.objects.create(
            listing_id=listing.id if listing else None,
            listing_title=listing.title if listing else '',
            listing_type=listing.listing_type if listing else '',
        )
        conv.participants.add(user1, user2)
        return conv

    def send_message(self, conversation, sender, content='Hello!'):
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content,
        )
