"""
Fuzz Tests — send random, malformed, boundary, and unexpected inputs to
every write endpoint. The server must never crash with HTTP 500; it should
return 400 or 422 for invalid input.

Rule: any input → status code must be in {200, 201, 400, 401, 403, 404, 405}.
A 500 means the server has an unhandled exception bug.
"""
import random
import string

from django.test import override_settings

from .base import BaseAPITest, TEST_SETTINGS

# ─── Payload generators ────────────────────────────────────────────────────────

def _rand_str(length=20, alphabet=None):
    alphabet = alphabet or (string.printable)
    return ''.join(random.choices(alphabet, k=length))


FUZZ_STRINGS = [
    # Empty / whitespace
    '',
    ' ',
    '\t\n\r',
    # Extreme length
    'A' * 10_000,
    'A' * 1,
    # Unicode chaos
    '你好世界',
    '𝕳𝖊𝖑𝖑𝖔',
    '日本語テスト',
    '🔥💀🎭',
    '',
    # Path traversal
    '../../../../etc/passwd',
    '../..',
    '%2e%2e%2f%2e%2e%2f',
    # Null bytes
    '\x00',
    'test\x00injection',
    # Format strings
    '%s%s%s%s%s%s',
    '%x%x%x%x%x%x',
    '{0.__class__}',
    # Template injection
    '{{7*7}}',
    '${7*7}',
    '<%= 7*7 %>',
    # SQL injection
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1 UNION SELECT null,null,null--",
    # HTML/JS injection
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    # Large numbers
    '9999999999999999999999999999',
    '-9999999999999999999999999999',
    # Invalid types
    'true',
    'false',
    'null',
    '[]',
    '{}',
    # Special characters
    '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
    # Newlines in fields
    'line1\nline2\nline3',
    'line1\r\nline2',
]

FUZZ_NUMBERS = [
    None,
    '',
    'abc',
    '-1',
    '0',
    '99999999999',
    '1.23.45',
    '1e999',
    '∞',
    '3.14159265358979323846',
    '0x1F',
]

FUZZ_EMAILS = [
    '',
    'notanemail',
    '@nodomain.com',
    'no@',
    'a' * 300 + '@example.com',
    '<script>@example.com',
    'test+tag@example.com',
    '"quoted"@example.com',
]

# 429 (rate limited) is an acceptable non-crash response for fuzz testing
ALLOWED_STATUSES = {200, 201, 400, 401, 403, 404, 405, 429}


def assert_no_500(test, response, context=''):
    test.assertIn(
        response.status_code,
        ALLOWED_STATUSES,
        f"Got unexpected {response.status_code} for {context}"
    )


# ─── Auth Fuzz ─────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestAuthFuzz(BaseAPITest):

    def test_login_fuzz_email(self):
        for value in FUZZ_EMAILS:
            with self.subTest(email=repr(value)):
                r = self.client.post('/api/auth/login/', {'email': value, 'password': 'Pass1234!'}, format='json')
                assert_no_500(self, r, f'login email={repr(value)}')

    def test_login_fuzz_password(self):
        for value in FUZZ_STRINGS[:15]:
            with self.subTest(password=repr(value[:30])):
                r = self.client.post('/api/auth/login/', {'email': 'x@x.com', 'password': value}, format='json')
                assert_no_500(self, r, f'login password={repr(value[:30])}')

    def test_register_fuzz_all_fields(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(value=repr(value[:30])):
                r = self.client.post('/api/auth/registration/', {
                    'email': value,
                    'password1': value,
                    'password2': value,
                    'first_name': value,
                    'last_name': value,
                }, format='json')
                assert_no_500(self, r, f'register value={repr(value[:30])}')

    def test_token_refresh_fuzz(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(refresh=repr(value[:30])):
                r = self.client.post('/api/auth/token/refresh/', {'refresh': value}, format='json')
                assert_no_500(self, r, f'token refresh={repr(value[:30])}')


# ─── Listing Fuzz ──────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestListingFuzz(BaseAPITest):

    def setUp(self):
        super().setUp()
        self.user = self.authenticate()

    def test_create_listing_fuzz_title(self):
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(title=repr(value[:30])):
                r = self.client.post('/api/listings/create/', {
                    'title': value,
                    'description': 'Valid description.',
                    'location': 'Sydney',
                    'state': 'NSW',
                    'listing_type': 'job',
                }, format='json')
                assert_no_500(self, r, f'create listing title={repr(value[:30])}')

    def test_create_listing_fuzz_state(self):
        for value in FUZZ_STRINGS[:8]:
            with self.subTest(state=repr(value[:30])):
                r = self.client.post('/api/listings/create/', {
                    'title': 'Valid Title',
                    'description': 'Valid.',
                    'location': 'Sydney',
                    'state': value,
                    'listing_type': 'job',
                }, format='json')
                assert_no_500(self, r, f'create listing state={repr(value[:30])}')

    def test_create_listing_fuzz_listing_type(self):
        invalid_types = ['', 'hack', 'ADMIN', '<script>', '1', None, '{}', 'job; DROP TABLE']
        for value in invalid_types:
            with self.subTest(listing_type=repr(value)):
                r = self.client.post('/api/listings/create/', {
                    'title': 'Valid Title',
                    'description': 'Valid.',
                    'location': 'Sydney',
                    'state': 'NSW',
                    'listing_type': value,
                }, format='json')
                assert_no_500(self, r, f'create listing type={repr(value)}')

    def test_search_fuzz_query(self):
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(q=repr(value[:30])):
                r = self.client.get(f'/api/listings/search/?q={value[:200]}')
                assert_no_500(self, r, f'search q={repr(value[:30])}')

    def test_listing_slug_fuzz(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(slug=repr(value[:30])):
                r = self.client.get(f'/api/listings/{value[:200]}/')
                assert_no_500(self, r, f'slug={repr(value[:30])}')

    def test_listing_id_fuzz(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(id=repr(value)):
                r = self.client.get(f'/api/listings/{value}/similar/')
                assert_no_500(self, r, f'listing id={repr(value)}')

    def test_report_listing_fuzz_reason(self):
        job = self.create_job()
        for value in FUZZ_STRINGS[:8]:
            with self.subTest(reason=repr(value[:30])):
                r = self.client.post(f'/api/listings/{job.listing.id}/report/', {
                    'reason': value,
                    'details': value,
                }, format='json')
                assert_no_500(self, r, f'report reason={repr(value[:30])}')


# ─── Job Fuzz ──────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestJobFuzz(BaseAPITest):

    def setUp(self):
        super().setUp()
        self.user = self.authenticate()

    def test_create_job_fuzz_job_type(self):
        invalid_types = ['', 'HACKER', 'full-time', 'null', '{}', '<script>']
        for value in invalid_types:
            with self.subTest(job_type=repr(value)):
                r = self.client.post('/api/jobs/create/', {
                    'title': 'Valid Title',
                    'description': 'Valid.',
                    'location': 'Sydney',
                    'state': 'NSW',
                    'job_type': value,
                    'salary_type': 'hourly',
                }, format='json')
                assert_no_500(self, r, f'job type={repr(value)}')

    def test_create_job_fuzz_salary(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(salary=repr(value)):
                r = self.client.post('/api/jobs/create/', {
                    'title': 'Valid Title',
                    'description': 'Valid.',
                    'location': 'Sydney',
                    'state': 'NSW',
                    'job_type': 'casual',
                    'salary_type': 'hourly',
                    'salary': value,
                }, format='json')
                assert_no_500(self, r, f'salary={repr(value)}')

    def test_update_job_fuzz_fields(self):
        job = self.create_job(user=self.user)
        for value in FUZZ_STRINGS[:8]:
            with self.subTest(value=repr(value[:30])):
                r = self.client.patch(f'/api/jobs/{job.id}/', {'company_name': value}, format='json')
                assert_no_500(self, r, f'job patch company_name={repr(value[:30])}')


# ─── Room Fuzz ─────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestRoomFuzz(BaseAPITest):

    def setUp(self):
        super().setUp()
        self.user = self.authenticate()

    def test_create_room_fuzz_price(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(price=repr(value)):
                r = self.client.post('/api/rooms/create/', {
                    'title': 'Room',
                    'description': 'Valid.',
                    'location': 'Sydney',
                    'state': 'NSW',
                    'room_type': 'private',
                    'price': value,
                    'furnishing': 'furnished',
                    'bond': '4_weeks',
                }, format='json')
                assert_no_500(self, r, f'room price={repr(value)}')

    def test_create_room_fuzz_room_type(self):
        invalid_types = ['', 'HACK', 'private room', '<script>', '1']
        for value in invalid_types:
            with self.subTest(room_type=repr(value)):
                r = self.client.post('/api/rooms/create/', {
                    'title': 'Room',
                    'description': 'Valid.',
                    'location': 'Sydney',
                    'state': 'NSW',
                    'room_type': value,
                    'price': '200.00',
                    'furnishing': 'furnished',
                    'bond': '4_weeks',
                }, format='json')
                assert_no_500(self, r, f'room type={repr(value)}')


# ─── Business Fuzz ─────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestBusinessFuzz(BaseAPITest):

    def setUp(self):
        super().setUp()
        self.user = self.authenticate()

    def test_create_business_fuzz_category(self):
        invalid = ['', 'HACKER', 'null', '<img>', '{}', 'restaurant; DROP TABLE']
        for value in invalid:
            with self.subTest(category=repr(value)):
                r = self.client.post('/api/businesses/create/', {
                    'business_name': 'Test Biz',
                    'category': value,
                    'description': 'Valid.',
                    'suburb': 'Sydney',
                    'state': 'NSW',
                }, format='json')
                assert_no_500(self, r, f'biz category={repr(value)}')

    def test_create_business_fuzz_name(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(name=repr(value[:30])):
                r = self.client.post('/api/businesses/create/', {
                    'business_name': value,
                    'category': 'other',
                    'description': 'Valid.',
                    'suburb': 'Sydney',
                    'state': 'NSW',
                }, format='json')
                assert_no_500(self, r, f'biz name={repr(value[:30])}')

    def test_review_fuzz_rating(self):
        biz = self.create_business()
        invalid_ratings = ['', 'five', '-1', '6', '0', '100', 'null', '{}', '3.5']
        for value in invalid_ratings:
            with self.subTest(rating=repr(value)):
                r = self.client.post(f'/api/businesses/{biz.slug}/reviews/', {
                    'rating': value,
                    'comment': 'Test',
                }, format='json')
                assert_no_500(self, r, f'review rating={repr(value)}')


# ─── Messaging Fuzz ────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestMessagingFuzz(BaseAPITest):

    def test_send_message_fuzz_content(self):
        u1 = self.authenticate()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(content=repr(value[:30])):
                r = self.client.post(f'/api/messages/{conv.id}/send/', {'content': value}, format='json')
                assert_no_500(self, r, f'msg content={repr(value[:30])}')

    def test_start_conversation_fuzz_message(self):
        self.authenticate()
        recipient = self.create_user()
        for value in FUZZ_STRINGS[:8]:
            with self.subTest(msg=repr(value[:30])):
                r = self.client.post('/api/messages/', {
                    'recipient_id': recipient.id,
                    'message': value,
                }, format='json')
                assert_no_500(self, r, f'new conv msg={repr(value[:30])}')

    def test_conversation_id_fuzz(self):
        u1 = self.authenticate()
        for value in FUZZ_NUMBERS:
            with self.subTest(conv_id=repr(value)):
                r = self.client.get(f'/api/messages/{value}/')
                assert_no_500(self, r, f'conv id={repr(value)}')


# ─── Profile Update Fuzz ───────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestProfileFuzz(BaseAPITest):

    def setUp(self):
        super().setUp()
        self.authenticate()

    def test_profile_patch_fuzz_phone(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(phone=repr(value[:30])):
                r = self.client.patch('/api/users/profile/', {'phone': value}, format='json')
                assert_no_500(self, r, f'profile phone={repr(value[:30])}')

    def test_profile_patch_fuzz_bio(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(bio=repr(value[:30])):
                r = self.client.patch('/api/users/profile/', {'bio': value}, format='json')
                assert_no_500(self, r, f'profile bio={repr(value[:30])}')

    def test_profile_patch_fuzz_email(self):
        for value in FUZZ_EMAILS:
            with self.subTest(email=repr(value)):
                r = self.client.patch('/api/users/profile/', {'email': value}, format='json')
                assert_no_500(self, r, f'profile email={repr(value)}')
