"""
Contract / Schema Validation Tests — verify that API responses contain the
expected fields with the correct data types and structure.
These tests act as the API contract: if a field disappears or changes type,
the test catches it before consumers are broken.
"""
from django.test import override_settings

from .base import BaseAPITest, TEST_SETTINGS


def assert_field(test, data, field, expected_type=None, nullable=False):
    """Helper: assert a field exists and has the right type."""
    test.assertIn(field, data, f"Field '{field}' missing from response")
    if expected_type and not (nullable and data[field] is None):
        test.assertIsInstance(
            data[field], expected_type,
            f"Field '{field}' expected {expected_type.__name__}, got {type(data[field]).__name__}"
        )


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestAuthSchema(BaseAPITest):

    def test_login_response_schema(self):
        user = self.create_user(email='schema@test.com', password='Pass1234!')
        r = self.client.post('/api/auth/login/', {'email': 'schema@test.com', 'password': 'Pass1234!'})
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'access', str)
        assert_field(self, r.data, 'refresh', str)
        assert_field(self, r.data, 'user')

    def test_token_refresh_response_schema(self):
        user = self.create_user(email='refresh_schema@test.com', password='Pass1234!')
        _, refresh, _ = self.login_via_api('refresh_schema@test.com', 'Pass1234!')
        r = self.client.post('/api/auth/token/refresh/', {'refresh': refresh})
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'access', str)


# ─── User / Profile Schemas ────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestProfileSchema(BaseAPITest):

    REQUIRED_PROFILE_FIELDS = [
        ('id', int),
        ('email', str),
        ('first_name', str),
        ('last_name', str),
        ('phone', str),
        ('location', str),
        ('bio', str),
        ('is_verified', bool),
        ('created_at', str),
    ]

    def test_profile_response_schema(self):
        self.authenticate()
        r = self.client.get('/api/users/profile/')
        self.assertEqual(r.status_code, 200)
        for field, ftype in self.REQUIRED_PROFILE_FIELDS:
            assert_field(self, r.data, field, ftype)

    def test_profile_has_no_password_field(self):
        self.authenticate()
        r = self.client.get('/api/users/profile/')
        self.assertNotIn('password', r.data)


# ─── Listing Schemas ───────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestListingSchema(BaseAPITest):

    REQUIRED_LISTING_FIELDS = [
        ('id', int),
        ('title', str),
        ('description', str),
        ('location', str),
        ('state', str),
        ('listing_type', str),
        ('status', str),
        ('slug', str),
        ('is_featured', bool),
        ('created_at', str),
    ]

    def test_listing_list_response_is_paginated(self):
        r = self.client.get('/api/listings/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'count', int)
        assert_field(self, r.data, 'results', list)

    def test_listing_detail_schema(self):
        job = self.create_job()
        r = self.client.get(f'/api/listings/{job.listing.slug}/')
        self.assertEqual(r.status_code, 200)
        for field, ftype in self.REQUIRED_LISTING_FIELDS:
            assert_field(self, r.data, field, ftype)

    def test_listing_slug_is_string(self):
        job = self.create_job()
        r = self.client.get(f'/api/listings/{job.listing.slug}/')
        self.assertIsInstance(r.data['slug'], str)
        self.assertGreater(len(r.data['slug']), 0)

    def test_listing_list_results_have_required_fields(self):
        self.create_job()
        r = self.client.get('/api/listings/')
        self.assertEqual(r.status_code, 200)
        if r.data['results']:
            item = r.data['results'][0]
            assert_field(self, item, 'id', int)
            assert_field(self, item, 'title', str)
            assert_field(self, item, 'slug', str)

    def test_pagination_next_prev_fields(self):
        r = self.client.get('/api/listings/')
        self.assertIn('next', r.data)
        self.assertIn('previous', r.data)


# ─── Job Schemas ───────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestJobSchema(BaseAPITest):

    REQUIRED_JOB_FIELDS = [
        ('id', int),
        ('job_type', str),
        ('salary_type', str),
        ('company_name', str),
    ]

    def test_job_list_is_paginated(self):
        r = self.client.get('/api/jobs/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'count', int)
        assert_field(self, r.data, 'results', list)

    def test_job_detail_schema(self):
        job = self.create_job()
        r = self.client.get(f'/api/jobs/{job.id}/')
        self.assertEqual(r.status_code, 200)
        for field, ftype in self.REQUIRED_JOB_FIELDS:
            assert_field(self, r.data, field, ftype)

    def test_job_detail_via_slug_schema(self):
        job = self.create_job()
        r = self.client.get(f'/api/jobs/listing/{job.listing.slug}/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'id', int)
        assert_field(self, r.data, 'job_type', str)


# ─── Room Schemas ──────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestRoomSchema(BaseAPITest):

    REQUIRED_ROOM_FIELDS = [
        ('id', int),
        ('room_type', str),
        ('furnishing', str),
        ('bond', str),
        ('bills_included', bool),
    ]

    def test_room_list_is_paginated(self):
        r = self.client.get('/api/rooms/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'count', int)
        assert_field(self, r.data, 'results', list)

    def test_room_detail_schema(self):
        room = self.create_room()
        r = self.client.get(f'/api/rooms/{room.id}/')
        self.assertEqual(r.status_code, 200)
        for field, ftype in self.REQUIRED_ROOM_FIELDS:
            assert_field(self, r.data, field, ftype)


# ─── Event Schemas ─────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestEventSchema(BaseAPITest):

    REQUIRED_EVENT_FIELDS = [
        ('id', int),
        ('category', str),
        ('event_date', str),
        ('is_free', bool),
        ('is_online', bool),
    ]

    def test_event_list_is_paginated(self):
        r = self.client.get('/api/events/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'count', int)
        assert_field(self, r.data, 'results', list)

    def test_event_detail_schema(self):
        event = self.create_event()
        r = self.client.get(f'/api/events/{event.id}/')
        self.assertEqual(r.status_code, 200)
        for field, ftype in self.REQUIRED_EVENT_FIELDS:
            assert_field(self, r.data, field, ftype)


# ─── Business Schemas ──────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestBusinessSchema(BaseAPITest):

    REQUIRED_BUSINESS_FIELDS = [
        ('id', int),
        ('business_name', str),
        ('category', str),
        ('description', str),
        ('suburb', str),
        ('state', str),
        ('slug', str),
        ('is_verified', bool),
        ('is_active', bool),
        ('created_at', str),
    ]

    def test_business_list_is_paginated(self):
        r = self.client.get('/api/businesses/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'count', int)
        assert_field(self, r.data, 'results', list)

    def test_business_detail_schema(self):
        biz = self.create_business()
        r = self.client.get(f'/api/businesses/{biz.slug}/')
        self.assertEqual(r.status_code, 200)
        for field, ftype in self.REQUIRED_BUSINESS_FIELDS:
            assert_field(self, r.data, field, ftype)

    def test_business_detail_has_no_abn(self):
        biz = self.create_business()
        r = self.client.get(f'/api/businesses/{biz.slug}/')
        self.assertNotIn('abn', r.data)

    def test_business_reviews_list_schema(self):
        biz = self.create_business()
        r = self.client.get(f'/api/businesses/{biz.slug}/reviews/')
        self.assertEqual(r.status_code, 200)
        # Reviews may be paginated or a plain list
        if isinstance(r.data, dict):
            assert_field(self, r.data, 'count', int)
            assert_field(self, r.data, 'results', list)
        else:
            self.assertIsInstance(r.data, list)


# ─── Messaging Schemas ─────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestMessagingSchema(BaseAPITest):

    def test_conversations_list_schema(self):
        user = self.authenticate()
        r = self.client.get('/api/messages/')
        self.assertEqual(r.status_code, 200)
        # Messaging list may be paginated or a plain list
        if isinstance(r.data, dict):
            assert_field(self, r.data, 'count', int)
            assert_field(self, r.data, 'results', list)
        else:
            self.assertIsInstance(r.data, list)

    def test_unread_count_schema(self):
        self.authenticate()
        r = self.client.get('/api/messages/unread-count/')
        self.assertEqual(r.status_code, 200)
        assert_field(self, r.data, 'unread_count', int)

    def test_conversation_detail_schema(self):
        u1 = self.authenticate()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        r = self.client.get(f'/api/messages/{conv.id}/')
        self.assertEqual(r.status_code, 200)
        # The response wraps data under 'conversation' + 'messages' keys
        if 'conversation' in r.data:
            assert_field(self, r.data['conversation'], 'id', int)
            assert_field(self, r.data, 'messages', list)
        else:
            assert_field(self, r.data, 'id', int)
            self.assertIn('messages', r.data)


# ─── Error Response Schemas ────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestErrorResponseSchema(BaseAPITest):
    """Error responses must consistently use 'detail' or field-level error keys."""

    def test_401_response_has_detail_key(self):
        r = self.client.get('/api/users/profile/')
        self.assertEqual(r.status_code, 401)
        self.assertIn('detail', r.data)

    def test_404_response_has_detail_key(self):
        r = self.client.get('/api/listings/no-such-slug-99999/')
        self.assertEqual(r.status_code, 404)
        self.assertIn('detail', r.data)

    def test_400_response_for_bad_login_has_error_info(self):
        r = self.client.post('/api/auth/login/', {'email': 'bad@x.com', 'password': 'wrong'})
        self.assertEqual(r.status_code, 400)
        self.assertTrue(len(r.data) > 0)

    def test_validation_error_returns_field_name_keys(self):
        r = self.client.post('/api/auth/registration/', {'email': 'not-an-email'})
        self.assertEqual(r.status_code, 400)
        self.assertIsInstance(r.data, dict)
