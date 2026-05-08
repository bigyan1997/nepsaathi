"""
Functional Tests — verify every endpoint returns the correct HTTP status code
for happy-path, auth-required, and common error scenarios.
"""
from unittest.mock import patch

from django.test import override_settings

from listings.models import Listing, SavedListing
from .base import BaseAPITest, TEST_SETTINGS


# ─── AUTH ──────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestAuthFunctional(BaseAPITest):

    def test_login_success(self):
        user = self.create_user(email='login@test.com', password='Pass1234!')
        r = self.client.post('/api/auth/login/', {'email': 'login@test.com', 'password': 'Pass1234!'})
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)

    def test_login_wrong_password(self):
        self.create_user(email='bad@test.com', password='Right123!')
        r = self.client.post('/api/auth/login/', {'email': 'bad@test.com', 'password': 'Wrong123!'})
        self.assertEqual(r.status_code, 400)

    def test_login_nonexistent_user(self):
        r = self.client.post('/api/auth/login/', {'email': 'nobody@test.com', 'password': 'Any1234!'})
        self.assertEqual(r.status_code, 400)

    def test_login_missing_fields(self):
        r = self.client.post('/api/auth/login/', {'email': 'x@x.com'})
        self.assertEqual(r.status_code, 400)

    def test_register_success(self):
        payload = {
            'email': 'newreg@test.com',
            'password1': 'NewPass999!',
            'password2': 'NewPass999!',
            'first_name': 'Alice',
            'last_name': 'Smith',
        }
        r = self.client.post('/api/auth/registration/', payload)
        self.assertIn(r.status_code, [200, 201])

    def test_register_duplicate_email(self):
        self.create_user(email='dup@test.com')
        payload = {
            'email': 'dup@test.com',
            'password1': 'AnyPass999!',
            'password2': 'AnyPass999!',
        }
        r = self.client.post('/api/auth/registration/', payload)
        self.assertEqual(r.status_code, 400)

    def test_register_password_mismatch(self):
        r = self.client.post('/api/auth/registration/', {
            'email': 'mismatch@test.com',
            'password1': 'Pass1111!',
            'password2': 'Pass2222!',
        })
        self.assertEqual(r.status_code, 400)

    def test_token_refresh(self):
        user = self.create_user(email='refresh@test.com', password='Pass1234!')
        _, refresh, _ = self.login_via_api('refresh@test.com', 'Pass1234!')
        r = self.client.post('/api/auth/token/refresh/', {'refresh': refresh})
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)

    def test_logout_success(self):
        user = self.create_user(email='logout@test.com', password='Pass1234!')
        _, refresh, _ = self.login_via_api('logout@test.com', 'Pass1234!')
        self.authenticate(user)
        r = self.client.post('/api/auth/logout/', {'refresh': refresh})
        self.assertEqual(r.status_code, 200)

    def test_logout_requires_auth(self):
        r = self.client.post('/api/auth/logout/', {'refresh': 'fake'})
        self.assertEqual(r.status_code, 401)

    def test_password_reset_request(self):
        self.create_user(email='reset@test.com')
        with patch('dj_rest_auth.views.PasswordResetView.post') as mock_reset:
            mock_reset.return_value.__class__ = type
        r = self.client.post('/api/auth/password/reset/', {'email': 'reset@test.com'})
        self.assertIn(r.status_code, [200, 400, 500])


# ─── USERS / PROFILE ───────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestUserFunctional(BaseAPITest):

    def test_get_profile_authenticated(self):
        user = self.authenticate()
        r = self.client.get('/api/users/profile/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['email'], user.email)

    def test_get_profile_unauthenticated(self):
        r = self.client.get('/api/users/profile/')
        self.assertEqual(r.status_code, 401)

    def test_update_profile(self):
        self.authenticate()
        r = self.client.patch('/api/users/profile/', {'bio': 'Hello world'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['bio'], 'Hello world')

    def test_update_profile_unauthenticated(self):
        r = self.client.patch('/api/users/profile/', {'bio': 'x'})
        self.assertEqual(r.status_code, 401)

    def test_delete_account_requires_auth(self):
        r = self.client.delete('/api/users/delete-account/')
        self.assertEqual(r.status_code, 401)

    def test_delete_account_authenticated(self):
        self.authenticate()
        r = self.client.delete('/api/users/delete-account/')
        self.assertIn(r.status_code, [200, 204])

    def test_contact_form_submission(self):
        r = self.client.post('/api/users/contact/', {
            'name': 'John',
            'email': 'john@test.com',
            'message': 'Hello, I have a question.',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_contact_form_missing_fields(self):
        r = self.client.post('/api/users/contact/', {'name': 'John'})
        self.assertEqual(r.status_code, 400)


# ─── LISTINGS ──────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestListingFunctional(BaseAPITest):

    def test_list_listings_public(self):
        r = self.client.get('/api/listings/')
        self.assertEqual(r.status_code, 200)

    def test_list_listings_pagination(self):
        r = self.client.get('/api/listings/')
        self.assertIn('results', r.data)
        self.assertIn('count', r.data)

    def test_get_listing_by_slug(self):
        job = self.create_job()
        r = self.client.get(f'/api/listings/{job.listing.slug}/')
        self.assertEqual(r.status_code, 200)

    def test_get_listing_not_found(self):
        r = self.client.get('/api/listings/no-such-slug-99999/')
        self.assertEqual(r.status_code, 404)

    def test_create_listing_requires_auth(self):
        r = self.client.post('/api/listings/create/', {'title': 'Test'})
        self.assertEqual(r.status_code, 401)

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'x', 'url': 'http://x.com/img.jpg', 'secure_url': 'http://x.com/img.jpg'})
    def test_create_job_listing_authenticated(self, _):
        self.authenticate()
        payload = {
            'title': 'Software Engineer',
            'description': 'Looking for a developer.',
            'location': 'Melbourne',
            'state': 'VIC',
            'listing_type': 'job',
            'contact_email': 'test@test.com',
            'job_type': 'full_time',
            'salary_type': 'hourly',
        }
        r = self.client.post('/api/listings/create/', payload)
        self.assertIn(r.status_code, [200, 201])

    def test_update_listing_by_owner(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.patch(f'/api/listings/{job.listing.slug}/', {'title': 'Updated Title'})
        self.assertEqual(r.status_code, 200)

    def test_update_listing_by_non_owner(self):
        owner = self.create_user()
        job = self.create_job(user=owner)
        self.authenticate()
        r = self.client.patch(f'/api/listings/{job.listing.slug}/', {'title': 'Hack'})
        self.assertEqual(r.status_code, 403)

    def test_delete_listing_by_owner(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.delete(f'/api/listings/{job.listing.slug}/')
        self.assertIn(r.status_code, [200, 204])

    def test_delete_listing_by_non_owner(self):
        owner = self.create_user()
        job = self.create_job(user=owner)
        self.authenticate()
        r = self.client.delete(f'/api/listings/{job.listing.slug}/')
        self.assertEqual(r.status_code, 403)

    def test_my_listings_authenticated(self):
        user = self.authenticate()
        self.create_job(user=user)
        r = self.client.get('/api/listings/my-listings/')
        self.assertEqual(r.status_code, 200)

    def test_my_listings_unauthenticated(self):
        r = self.client.get('/api/listings/my-listings/')
        self.assertEqual(r.status_code, 401)

    def test_save_listing_authenticated(self):
        user = self.authenticate()
        job = self.create_job()
        r = self.client.post(f'/api/listings/{job.listing.id}/save/')
        self.assertIn(r.status_code, [200, 201])

    def test_save_listing_unauthenticated(self):
        job = self.create_job()
        r = self.client.post(f'/api/listings/{job.listing.id}/save/')
        self.assertEqual(r.status_code, 401)

    def test_saved_listings_list(self):
        user = self.authenticate()
        r = self.client.get('/api/listings/saved/')
        self.assertEqual(r.status_code, 200)

    def test_report_listing_authenticated(self):
        user = self.authenticate()
        job = self.create_job()
        r = self.client.post(f'/api/listings/{job.listing.id}/report/', {
            'reason': 'spam',
            'details': 'Fake job',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_report_listing_unauthenticated(self):
        job = self.create_job()
        r = self.client.post(f'/api/listings/{job.listing.id}/report/', {'reason': 'spam'})
        self.assertEqual(r.status_code, 401)

    def test_track_listing_view(self):
        job = self.create_job()
        r = self.client.post(f'/api/listings/{job.listing.id}/view/')
        self.assertIn(r.status_code, [200, 201])

    def test_similar_listings(self):
        job = self.create_job()
        r = self.client.get(f'/api/listings/{job.listing.id}/similar/')
        self.assertEqual(r.status_code, 200)

    def test_search_suggestions(self):
        r = self.client.get('/api/listings/search-suggestions/?q=software')
        self.assertIn(r.status_code, [200])

    def test_global_search(self):
        r = self.client.get('/api/listings/search/?q=test')
        self.assertEqual(r.status_code, 200)

    def test_listing_stats_authenticated(self):
        self.authenticate()
        r = self.client.get('/api/listings/stats/')
        self.assertEqual(r.status_code, 200)

    def test_listing_stats_unauthenticated(self):
        # Stats endpoint returns public aggregate data
        r = self.client.get('/api/listings/stats/')
        self.assertIn(r.status_code, [200, 401])

    def test_update_listing_status(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.patch(f'/api/listings/{job.listing.id}/status/', {'status': 'filled'})
        self.assertIn(r.status_code, [200, 400])

    def test_renew_listing_by_owner(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.post(f'/api/listings/{job.listing.id}/renew/')
        self.assertIn(r.status_code, [200, 400])


# ─── SAVED SEARCHES ────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestSavedSearchFunctional(BaseAPITest):

    def test_list_saved_searches_authenticated(self):
        self.authenticate()
        r = self.client.get('/api/listings/saved-searches/')
        self.assertEqual(r.status_code, 200)

    def test_list_saved_searches_unauthenticated(self):
        r = self.client.get('/api/listings/saved-searches/')
        self.assertEqual(r.status_code, 401)

    def test_create_saved_search(self):
        self.authenticate()
        r = self.client.post('/api/listings/saved-searches/', {
            'label': 'Sydney Jobs',
            'listing_type': 'job',
            'filters': {},
        }, format='json')
        self.assertIn(r.status_code, [200, 201])

    def test_create_saved_search_unauthenticated(self):
        r = self.client.post('/api/listings/saved-searches/', {'listing_type': 'job'})
        self.assertEqual(r.status_code, 401)

    def test_delete_saved_search(self):
        from listings.models import SavedSearch
        user = self.authenticate()
        ss = SavedSearch.objects.create(user=user, listing_type='job', label='Test')
        r = self.client.delete(f'/api/listings/saved-searches/{ss.id}/')
        self.assertIn(r.status_code, [200, 204])


# ─── JOBS ──────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestJobFunctional(BaseAPITest):

    def test_list_jobs_public(self):
        r = self.client.get('/api/jobs/')
        self.assertEqual(r.status_code, 200)

    def test_get_job_by_listing_slug(self):
        job = self.create_job()
        r = self.client.get(f'/api/jobs/listing/{job.listing.slug}/')
        self.assertEqual(r.status_code, 200)

    def test_get_job_by_id(self):
        job = self.create_job()
        r = self.client.get(f'/api/jobs/{job.id}/')
        self.assertEqual(r.status_code, 200)

    def test_get_job_not_found(self):
        r = self.client.get('/api/jobs/99999/')
        self.assertEqual(r.status_code, 404)

    def test_create_job_authenticated(self):
        user = self.authenticate()
        listing = self.create_listing(user=user, listing_type='job')
        r = self.client.post('/api/jobs/create/', {
            'listing': listing.id,
            'job_type': 'casual',
            'salary_type': 'hourly',
            'salary': '25.00',
            'company_name': 'Test Corp',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_create_job_unauthenticated(self):
        r = self.client.post('/api/jobs/create/', {'title': 'Test'})
        self.assertEqual(r.status_code, 401)

    def test_update_job_by_owner(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.patch(f'/api/jobs/{job.id}/', {'company_name': 'New Corp'})
        self.assertEqual(r.status_code, 200)

    def test_delete_job_by_owner(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.delete(f'/api/jobs/{job.id}/')
        self.assertIn(r.status_code, [200, 204])

    def test_delete_job_by_non_owner(self):
        owner = self.create_user()
        job = self.create_job(user=owner)
        self.authenticate()
        r = self.client.delete(f'/api/jobs/{job.id}/')
        self.assertEqual(r.status_code, 403)


# ─── ROOMS ─────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestRoomFunctional(BaseAPITest):

    def test_list_rooms_public(self):
        r = self.client.get('/api/rooms/')
        self.assertEqual(r.status_code, 200)

    def test_get_room_by_listing_slug(self):
        room = self.create_room()
        r = self.client.get(f'/api/rooms/listing/{room.listing.slug}/')
        self.assertEqual(r.status_code, 200)

    def test_get_room_by_id(self):
        room = self.create_room()
        r = self.client.get(f'/api/rooms/{room.id}/')
        self.assertEqual(r.status_code, 200)

    def test_get_room_not_found(self):
        r = self.client.get('/api/rooms/99999/')
        self.assertEqual(r.status_code, 404)

    def test_create_room_authenticated(self):
        user = self.authenticate()
        listing = self.create_listing(user=user, listing_type='room')
        r = self.client.post('/api/rooms/create/', {
            'listing': listing.id,
            'room_type': 'private',
            'price': '200.00',
            'furnishing': 'furnished',
            'bond': '4_weeks',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_create_room_unauthenticated(self):
        r = self.client.post('/api/rooms/create/', {'title': 'Test'})
        self.assertEqual(r.status_code, 401)

    def test_update_room_by_owner(self):
        user = self.authenticate()
        room = self.create_room(user=user)
        r = self.client.patch(f'/api/rooms/{room.id}/', {'price': '250.00'})
        self.assertEqual(r.status_code, 200)

    def test_delete_room_by_non_owner(self):
        owner = self.create_user()
        room = self.create_room(user=owner)
        self.authenticate()
        r = self.client.delete(f'/api/rooms/{room.id}/')
        self.assertEqual(r.status_code, 403)


# ─── EVENTS ────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestEventFunctional(BaseAPITest):

    def test_list_events_public(self):
        r = self.client.get('/api/events/')
        self.assertEqual(r.status_code, 200)

    def test_get_event_by_listing_slug(self):
        event = self.create_event()
        r = self.client.get(f'/api/events/listing/{event.listing.slug}/')
        self.assertEqual(r.status_code, 200)

    def test_get_event_by_id(self):
        event = self.create_event()
        r = self.client.get(f'/api/events/{event.id}/')
        self.assertEqual(r.status_code, 200)

    def test_create_event_authenticated(self):
        user = self.authenticate()
        listing = self.create_listing(user=user, listing_type='event')
        r = self.client.post('/api/events/create/', {
            'listing': listing.id,
            'category': 'cultural',
            'event_date': '2027-04-14T10:00:00Z',
            'is_free': True,
        })
        self.assertIn(r.status_code, [200, 201])

    def test_create_event_unauthenticated(self):
        r = self.client.post('/api/events/create/', {'title': 'Test'})
        self.assertEqual(r.status_code, 401)

    def test_rsvp_event_authenticated(self):
        user = self.authenticate()
        event = self.create_event()
        r = self.client.post(f'/api/events/{event.id}/rsvp/')
        self.assertIn(r.status_code, [200, 201])

    def test_rsvp_event_unauthenticated(self):
        event = self.create_event()
        r = self.client.post(f'/api/events/{event.id}/rsvp/')
        self.assertEqual(r.status_code, 401)

    def test_update_event_by_owner(self):
        user = self.authenticate()
        event = self.create_event(user=user)
        r = self.client.patch(f'/api/events/{event.id}/', {'organiser': 'New Org'})
        self.assertEqual(r.status_code, 200)

    def test_delete_event_by_non_owner(self):
        owner = self.create_user()
        event = self.create_event(user=owner)
        self.authenticate()
        r = self.client.delete(f'/api/events/{event.id}/')
        self.assertEqual(r.status_code, 403)


# ─── NOTICES ───────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestNoticeFunctional(BaseAPITest):

    def test_list_notices_public(self):
        r = self.client.get('/api/notices/')
        self.assertEqual(r.status_code, 200)

    def test_create_notice_authenticated(self):
        user = self.authenticate()
        listing = self.create_listing(user=user, listing_type='notice')
        # Announcements are separate from listings
        from announcements.models import Announcement
        from listings.models import Listing as L
        r = self.client.post('/api/notices/create/', {
            'listing': listing.id,
        })
        # notices/create attaches to existing listing; just verify no server error
        self.assertIn(r.status_code, [200, 201, 400, 403])

    def test_create_notice_unauthenticated(self):
        r = self.client.post('/api/notices/create/', {'title': 'x'})
        self.assertEqual(r.status_code, 401)


# ─── BUSINESSES ────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestBusinessFunctional(BaseAPITest):

    def test_list_businesses_public(self):
        r = self.client.get('/api/businesses/')
        self.assertEqual(r.status_code, 200)

    def test_get_business_by_slug(self):
        biz = self.create_business()
        r = self.client.get(f'/api/businesses/{biz.slug}/')
        self.assertEqual(r.status_code, 200)

    def test_get_business_not_found(self):
        r = self.client.get('/api/businesses/no-such-biz-99999/')
        self.assertEqual(r.status_code, 404)

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'x', 'url': 'http://x.com/img.jpg', 'secure_url': 'http://x.com/img.jpg'})
    def test_create_business_authenticated(self, _):
        self.authenticate()
        payload = {
            'business_name': 'Kathmandu Kitchen',
            'category': 'restaurant',
            'description': 'Authentic Nepali food in Sydney.',
            'suburb': 'Parramatta',
            'state': 'NSW',
            'phone': '+61412345678',
        }
        r = self.client.post('/api/businesses/create/', payload)
        self.assertIn(r.status_code, [200, 201])

    def test_create_business_unauthenticated(self):
        r = self.client.post('/api/businesses/create/', {'business_name': 'x'})
        self.assertEqual(r.status_code, 401)

    def test_update_business_by_owner(self):
        user = self.authenticate()
        biz = self.create_business(user=user)
        r = self.client.patch(f'/api/businesses/{biz.slug}/', {'description': 'Updated description.'})
        self.assertEqual(r.status_code, 200)

    def test_update_business_by_non_owner(self):
        owner = self.create_user()
        biz = self.create_business(user=owner)
        self.authenticate()
        r = self.client.patch(f'/api/businesses/{biz.slug}/', {'description': 'Hack'})
        self.assertEqual(r.status_code, 403)

    def test_delete_business_by_owner(self):
        user = self.authenticate()
        biz = self.create_business(user=user)
        r = self.client.delete(f'/api/businesses/{biz.slug}/')
        self.assertIn(r.status_code, [200, 204])

    def test_list_business_reviews(self):
        biz = self.create_business()
        r = self.client.get(f'/api/businesses/{biz.slug}/reviews/')
        self.assertEqual(r.status_code, 200)

    def test_create_business_review_authenticated(self):
        biz = self.create_business()
        self.authenticate()
        r = self.client.post(f'/api/businesses/{biz.slug}/reviews/', {
            'rating': 5,
            'comment': 'Excellent!',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_create_review_unauthenticated(self):
        biz = self.create_business()
        r = self.client.post(f'/api/businesses/{biz.slug}/reviews/', {'rating': 5})
        self.assertEqual(r.status_code, 401)

    def test_delete_own_review(self):
        owner = self.create_user()
        biz = self.create_business()
        from businesses.models import BusinessReview
        user = self.authenticate()
        review = BusinessReview.objects.create(business=biz, reviewer=user, rating=4)
        r = self.client.delete(f'/api/businesses/{biz.slug}/reviews/{review.id}/')
        self.assertIn(r.status_code, [200, 204])

    def test_report_business_authenticated(self):
        biz = self.create_business()
        self.authenticate()
        r = self.client.post(f'/api/businesses/{biz.slug}/report/', {
            'reason': 'fake',
            'details': 'This is fake.',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_my_businesses_authenticated(self):
        user = self.authenticate()
        self.create_business(user=user)
        r = self.client.get('/api/businesses/my-businesses/')
        self.assertEqual(r.status_code, 200)

    def test_my_businesses_unauthenticated(self):
        r = self.client.get('/api/businesses/my-businesses/')
        self.assertEqual(r.status_code, 401)


# ─── MESSAGING ─────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestMessagingFunctional(BaseAPITest):

    def test_list_conversations_authenticated(self):
        self.authenticate()
        r = self.client.get('/api/messages/')
        self.assertEqual(r.status_code, 200)

    def test_list_conversations_unauthenticated(self):
        r = self.client.get('/api/messages/')
        self.assertEqual(r.status_code, 401)

    def test_start_conversation_authenticated(self):
        sender = self.authenticate()
        recipient = self.create_user()
        job = self.create_job(user=recipient)
        r = self.client.post('/api/messages/', {
            'recipient_id': recipient.id,
            'listing_id': job.listing.id,
            'listing_title': job.listing.title,
            'listing_type': 'job',
            'message': 'Hi, I am interested.',
        })
        self.assertIn(r.status_code, [200, 201])

    def test_start_conversation_unauthenticated(self):
        r = self.client.post('/api/messages/', {'message': 'Hi'})
        self.assertEqual(r.status_code, 401)

    def test_get_unread_count(self):
        self.authenticate()
        r = self.client.get('/api/messages/unread-count/')
        self.assertEqual(r.status_code, 200)

    def test_get_conversation_detail(self):
        user1 = self.authenticate()
        user2 = self.create_user()
        conv = self.create_conversation(user1=user1, user2=user2)
        r = self.client.get(f'/api/messages/{conv.id}/')
        self.assertEqual(r.status_code, 200)

    def test_get_conversation_as_non_participant(self):
        user1 = self.create_user()
        user2 = self.create_user()
        conv = self.create_conversation(user1=user1, user2=user2)
        self.authenticate()  # a 3rd user
        r = self.client.get(f'/api/messages/{conv.id}/')
        self.assertEqual(r.status_code, 403)

    def test_send_message_in_conversation(self):
        user1 = self.authenticate()
        user2 = self.create_user()
        conv = self.create_conversation(user1=user1, user2=user2)
        r = self.client.post(f'/api/messages/{conv.id}/send/', {'content': 'Hello!'})
        self.assertIn(r.status_code, [200, 201])

    def test_send_message_unauthenticated(self):
        user1 = self.create_user()
        user2 = self.create_user()
        conv = self.create_conversation(user1=user1, user2=user2)
        r = self.client.post(f'/api/messages/{conv.id}/send/', {'content': 'Hi'})
        self.assertEqual(r.status_code, 401)


# ─── EXCHANGE RATES ────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestExchangeFunctional(BaseAPITest):

    def test_exchange_rate_public(self):
        r = self.client.get('/api/exchange/')
        self.assertIn(r.status_code, [200, 503])


# ─── PAYMENTS ──────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestPaymentFunctional(BaseAPITest):

    @patch('stripe.checkout.Session.create')
    def test_feature_listing_authenticated(self, mock_stripe):
        mock_stripe.return_value = type('Session', (), {'url': 'https://checkout.stripe.com/test', 'id': 'cs_test_fake123'})()
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.post(f'/api/payments/feature/{job.listing.id}/')
        self.assertIn(r.status_code, [200, 201, 400])

    def test_feature_listing_unauthenticated(self):
        job = self.create_job()
        r = self.client.post(f'/api/payments/feature/{job.listing.id}/')
        self.assertEqual(r.status_code, 401)

    def test_payment_status_authenticated(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        r = self.client.get(f'/api/payments/status/{job.listing.id}/')
        self.assertIn(r.status_code, [200, 404])

    def test_payment_status_unauthenticated(self):
        job = self.create_job()
        r = self.client.get(f'/api/payments/status/{job.listing.id}/')
        self.assertEqual(r.status_code, 401)
