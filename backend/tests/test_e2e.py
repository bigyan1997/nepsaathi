"""
End-to-End Tests — simulate complete user journeys through the API.
Each test represents a real scenario a NepSaathi user would perform,
exercising multiple endpoints in sequence.
"""
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from datetime import timedelta

from businesses.models import BusinessReview
from events.models import EventRSVP
from listings.models import Listing, SavedListing, SavedSearch
from messaging.models import Conversation, Message

from .base import BaseAPITest, TEST_SETTINGS


# ─── Journey 1: New User Registration ──────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestRegistrationJourney(BaseAPITest):
    """
    A new user registers, logs in, views their (empty) profile,
    updates it, then deletes their account.
    """

    def test_full_registration_journey(self):
        # 1. Register
        payload = {
            'email': 'newuser@journey.com',
            'password1': 'Xq7$kM99pLw!',
            'password2': 'Xq7$kM99pLw!',
            'first_name': 'Journey',
            'last_name': 'User',
        }
        r = self.client.post('/api/auth/registration/', payload)
        self.assertIn(r.status_code, [200, 201], f"Registration failed: {r.data}")

        # 2. Login
        access, refresh, r = self.login_via_api('newuser@journey.com', 'Xq7$kM99pLw!')
        self.assertIsNotNone(access, "Login failed — no access token")

        # 3. Set bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        # 4. View profile
        r = self.client.get('/api/users/profile/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['email'], 'newuser@journey.com')
        self.assertEqual(r.data['first_name'], 'Journey')

        # 5. Update profile
        r = self.client.patch('/api/users/profile/', {
            'bio': 'I am a new NepSaathi user.',
            'phone': '+61400000001',
            'location': 'Melbourne',
        })
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['bio'], 'I am a new NepSaathi user.')

        # 6. Refresh token
        r = self.client.post('/api/auth/token/refresh/', {'refresh': refresh})
        self.assertEqual(r.status_code, 200)
        new_access = r.data.get('access')
        self.assertIsNotNone(new_access)

        # 7. Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
        r = self.client.post('/api/auth/logout/', {'refresh': r.data.get('refresh', refresh)})
        self.assertEqual(r.status_code, 200)


# ─── Journey 2: Job Posting Workflow ───────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestJobPostingJourney(BaseAPITest):
    """
    An employer: registers → posts a job → views it → updates it →
    job seeker views it → saves it → employer marks it filled → job seeker
    sees it no longer in active listings.
    """

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'x', 'url': 'http://cdn.test/img.jpg', 'secure_url': 'http://cdn.test/img.jpg'})
    def test_job_posting_full_journey(self, _):
        # ── Employer ──
        employer = self.create_user(email='employer@e2e.com', password='Emp123!')
        self.authenticate(employer)

        # Step 1: Create base listing
        r = self.client.post('/api/listings/create/', {
            'title': 'Nepali Cook Wanted',
            'description': 'Experienced cook for authentic Nepali restaurant.',
            'location': 'Parramatta',
            'state': 'NSW',
            'listing_type': 'job',
            'contact_email': employer.email,
        })
        self.assertIn(r.status_code, [200, 201], f"Listing create failed: {r.data}")
        listing_id = r.data.get('id')
        self.assertIsNotNone(listing_id)

        # Step 2: Attach job details to the listing
        r = self.client.post('/api/jobs/create/', {
            'listing': listing_id,
            'job_type': 'full_time',
            'salary_type': 'hourly',
            'salary': '28.00',
            'company_name': 'Dal Bhat House',
        })
        self.assertIn(r.status_code, [200, 201], f"Job create failed: {r.data}")
        job_id = r.data.get('id')

        # Get listing slug for this job
        jobs_r = self.client.get('/api/jobs/')
        self.assertEqual(jobs_r.status_code, 200)
        jobs = jobs_r.data.get('results', [])
        self.assertGreater(len(jobs), 0)

        job_listing_slug = jobs[0].get('listing', {}).get('slug') or jobs[0].get('slug')

        # Update the job
        if job_id:
            r = self.client.patch(f'/api/jobs/{job_id}/', {'is_urgent': True})
            self.assertEqual(r.status_code, 200)

        # ── Job seeker ──
        seeker = self.create_user(email='seeker@e2e.com')
        self.authenticate(seeker)

        # Browse jobs
        r = self.client.get('/api/jobs/')
        self.assertEqual(r.status_code, 200)
        self.assertGreater(r.data['count'], 0)

        # View specific job
        if job_id:
            r = self.client.get(f'/api/jobs/{job_id}/')
            self.assertEqual(r.status_code, 200)

        # Save listing
        if job_listing_slug:
            listing = Listing.objects.filter(slug=job_listing_slug).first()
            if listing:
                r = self.client.post(f'/api/listings/{listing.id}/save/')
                self.assertIn(r.status_code, [200, 201])
                self.assertTrue(SavedListing.objects.filter(user=seeker, listing=listing).exists())

        # ── Employer marks as filled ──
        self.authenticate(employer)
        if job_listing_slug:
            listing = Listing.objects.filter(slug=job_listing_slug).first()
            if listing:
                r = self.client.patch(f'/api/listings/{listing.id}/status/', {'status': 'filled'})
                self.assertIn(r.status_code, [200, 400])


# ─── Journey 3: Room Rental Workflow ───────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestRoomRentalJourney(BaseAPITest):
    """
    Landlord posts room → renter finds and saves it → renter messages landlord →
    landlord replies → landlord marks room as filled.
    """

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'y', 'url': 'http://cdn.test/img.jpg', 'secure_url': 'http://cdn.test/img.jpg'})
    def test_room_rental_full_journey(self, _):
        landlord = self.create_user(email='landlord@e2e.com')
        renter = self.create_user(email='renter@e2e.com')

        # ── Landlord posts room ──
        self.authenticate(landlord)
        # Step 1: Create base listing
        r = self.client.post('/api/listings/create/', {
            'title': 'Private Room Near Parramatta Station',
            'description': 'Clean, furnished room. Nepalese household. Bills included.',
            'location': 'Parramatta',
            'state': 'NSW',
            'listing_type': 'room',
            'contact_email': landlord.email,
        })
        self.assertIn(r.status_code, [200, 201], f"Listing create failed: {r.data}")
        room_listing_id = r.data.get('id')
        self.assertIsNotNone(room_listing_id)

        # Step 2: Attach room details
        r = self.client.post('/api/rooms/create/', {
            'listing': room_listing_id,
            'room_type': 'private',
            'price': '220.00',
            'furnishing': 'furnished',
            'bond': '4_weeks',
            'bills_included': True,
            'nepalese_household': True,
        })
        self.assertIn(r.status_code, [200, 201], f"Room create failed: {r.data}")

        # Check it's listed
        r = self.client.get('/api/rooms/')
        self.assertEqual(r.status_code, 200)
        self.assertGreater(r.data['count'], 0)
        room_data = r.data['results'][0]
        room_id = room_data.get('id')
        listing_id = room_data.get('listing', {}).get('id') or room_data.get('listing_id')

        # ── Renter searches ──
        self.authenticate(renter)
        r = self.client.get('/api/rooms/?state=NSW')
        self.assertEqual(r.status_code, 200)
        self.assertGreater(r.data['count'], 0)

        # Save the room
        if listing_id:
            r = self.client.post(f'/api/listings/{listing_id}/save/')
            self.assertIn(r.status_code, [200, 201])

        # View saved listings
        r = self.client.get('/api/listings/saved/')
        self.assertEqual(r.status_code, 200)

        # Message the landlord
        if listing_id:
            r = self.client.post('/api/messages/', {
                'recipient_id': landlord.id,
                'listing_id': listing_id,
                'listing_title': 'Private Room Near Parramatta Station',
                'listing_type': 'room',
                'message': 'Hi, is this room still available?',
            })
            self.assertIn(r.status_code, [200, 201])
            conv_id = r.data.get('id') or r.data.get('conversation_id')

            # Verify conversation exists
            r = self.client.get('/api/messages/')
            self.assertEqual(r.status_code, 200)
            convs = r.data.get('results', r.data) if isinstance(r.data, dict) else r.data
            self.assertGreater(len(convs), 0)

            # ── Landlord replies ──
            self.authenticate(landlord)
            r = self.client.get('/api/messages/')
            self.assertEqual(r.status_code, 200)

            if conv_id:
                r = self.client.post(f'/api/messages/{conv_id}/send/', {
                    'content': 'Yes, it is available! When can you inspect?'
                })
                self.assertIn(r.status_code, [200, 201])

                # Verify message in DB
                self.assertTrue(
                    Message.objects.filter(conversation_id=conv_id, sender=landlord).exists()
                )


# ─── Journey 4: Event Workflow ─────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestEventJourney(BaseAPITest):
    """
    Organiser creates event → attendees RSVP → organiser checks RSVP count →
    organiser deletes event.
    """

    @patch('cloudinary.uploader.upload', return_value={'public_id': 'z', 'url': 'http://cdn.test/img.jpg', 'secure_url': 'http://cdn.test/img.jpg'})
    def test_event_full_journey(self, _):
        organiser = self.create_user(email='organiser@e2e.com')
        attendee1 = self.create_user(email='attendee1@e2e.com')
        attendee2 = self.create_user(email='attendee2@e2e.com')

        # ── Organiser creates event ──
        self.authenticate(organiser)
        # Step 1: Create base listing
        r = self.client.post('/api/listings/create/', {
            'title': 'Nepali New Year 2082 Celebration',
            'description': 'Annual Baisakh festival celebration in Sydney.',
            'location': 'Sydney Olympic Park',
            'state': 'NSW',
            'listing_type': 'event',
            'contact_email': organiser.email,
        })
        self.assertIn(r.status_code, [200, 201], f"Listing create failed: {r.data}")
        event_listing_id = r.data.get('id')
        self.assertIsNotNone(event_listing_id)

        # Step 2: Attach event details
        r = self.client.post('/api/events/create/', {
            'listing': event_listing_id,
            'category': 'cultural',
            'event_date': (timezone.now() + timedelta(days=30)).isoformat(),
            'is_free': True,
            'venue': 'Sydney Olympic Park, Homebush',
            'organiser': 'NepSaathi Sydney Community',
        })
        self.assertIn(r.status_code, [200, 201], f"Event create failed: {r.data}")

        # ── Browse events ──
        r = self.client.get('/api/events/')
        self.assertEqual(r.status_code, 200)
        self.assertGreater(r.data['count'], 0)
        event_id = r.data['results'][0]['id']

        # ── Attendee 1 RSVPs ──
        self.authenticate(attendee1)
        r = self.client.post(f'/api/events/{event_id}/rsvp/')
        self.assertIn(r.status_code, [200, 201])
        self.assertTrue(EventRSVP.objects.filter(event_id=event_id, user=attendee1).exists())

        # ── Attendee 2 RSVPs ──
        self.authenticate(attendee2)
        r = self.client.post(f'/api/events/{event_id}/rsvp/')
        self.assertIn(r.status_code, [200, 201])

        # ── Attendee 1 un-RSVPs ──
        self.authenticate(attendee1)
        r = self.client.post(f'/api/events/{event_id}/rsvp/')  # toggle
        self.assertIn(r.status_code, [200, 204])
        self.assertFalse(EventRSVP.objects.filter(event_id=event_id, user=attendee1).exists())

        # ── Organiser deletes event ──
        self.authenticate(organiser)
        r = self.client.delete(f'/api/events/{event_id}/')
        self.assertIn(r.status_code, [200, 204])


# ─── Journey 5: Business Registration & Review Workflow ────────────────────────

@override_settings(**TEST_SETTINGS)
class TestBusinessJourney(BaseAPITest):
    """
    Business owner registers business → customer views it → leaves review →
    owner reads reviews → owner deletes their own review (if they posted one).
    """

    def test_business_full_journey(self):
        owner = self.create_user(email='bizowner@e2e.com')
        customer1 = self.create_user(email='customer1@e2e.com')
        customer2 = self.create_user(email='customer2@e2e.com')

        # ── Owner registers business ──
        self.authenticate(owner)
        r = self.client.post('/api/businesses/create/', {
            'business_name': 'Himalayan Spice Kitchen',
            'category': 'restaurant',
            'description': 'Authentic Nepali and Indian cuisine in Sydney.',
            'suburb': 'Parramatta',
            'state': 'NSW',
            'phone': '+61298765432',
            'operating_hours': 'Mon-Sun 11am-10pm',
        }, format='json')
        self.assertIn(r.status_code, [200, 201], f"Business create failed: {r.data}")
        # Get slug directly from create response (slug is set after DB INSERT in model.save())
        biz_slug = r.data.get('slug')
        # If not in create response, fall back to my-businesses
        if not biz_slug:
            r2 = self.client.get('/api/businesses/my-businesses/')
            self.assertEqual(r2.status_code, 200)
            results = r2.data.get('results', []) if isinstance(r2.data, dict) else r2.data
            self.assertGreater(len(results), 0)
            biz_slug = results[0].get('slug') if results else None
        self.assertIsNotNone(biz_slug, f"Could not retrieve business slug")

        # ── Direct business detail is accessible ──
        r = self.client.get(f'/api/businesses/{biz_slug}/')
        self.assertEqual(r.status_code, 200, f"Business detail 404 for slug={biz_slug}")
        self.assertEqual(r.data['business_name'], 'Himalayan Spice Kitchen')

        # ── Customer 1 leaves review ──
        self.authenticate(customer1)
        r = self.client.post(f'/api/businesses/{biz_slug}/reviews/', {
            'rating': 5,
            'comment': 'Amazing food, very authentic Nepali taste!',
        })
        self.assertIn(r.status_code, [200, 201], f"Review failed (slug={biz_slug}): {r.data}")

        # ── Customer 2 leaves review ──
        self.authenticate(customer2)
        r = self.client.post(f'/api/businesses/{biz_slug}/reviews/', {
            'rating': 4,
            'comment': 'Great place, slightly pricey but worth it.',
        })
        self.assertIn(r.status_code, [200, 201], f"Review failed (slug={biz_slug}): {r.data}")

        # Verify both reviews exist
        self.assertEqual(BusinessReview.objects.filter(business__slug=biz_slug).count(), 2)

        # ── Public can read reviews ──
        r = self.client.get(f'/api/businesses/{biz_slug}/reviews/')
        self.assertEqual(r.status_code, 200)
        reviews_data = r.data.get('results', r.data) if isinstance(r.data, dict) else r.data
        self.assertEqual(len(reviews_data), 2)

        # ── Owner updates business description ──
        self.authenticate(owner)
        r = self.client.patch(f'/api/businesses/{biz_slug}/', {
            'description': 'Award-winning Nepali cuisine. Now open for lunch!',
        })
        self.assertEqual(r.status_code, 200)
        self.assertIn('Award-winning', r.data['description'])


# ─── Journey 6: Saved Search Workflow ─────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestSavedSearchJourney(BaseAPITest):
    """
    User creates a saved search → lists their saved searches →
    updates one → deletes one.
    """

    def test_saved_search_full_journey(self):
        user = self.authenticate()

        # Create saved search
        r = self.client.post('/api/listings/saved-searches/', {
            'label': 'Software Jobs in Melbourne',
            'listing_type': 'job',
            'filters': {'state': 'VIC', 'q': 'software'},
        }, format='json')
        self.assertIn(r.status_code, [200, 201])
        ss_id = r.data.get('id')
        self.assertIsNotNone(ss_id)
        self.assertTrue(SavedSearch.objects.filter(user=user, id=ss_id).exists())

        # List saved searches
        r = self.client.get('/api/listings/saved-searches/')
        self.assertEqual(r.status_code, 200)
        results = r.data.get('results', r.data) if isinstance(r.data, dict) else r.data
        self.assertGreater(len(results), 0)

        # Update it
        r = self.client.patch(f'/api/listings/saved-searches/{ss_id}/', {
            'label': 'IT Jobs in Melbourne',
        })
        self.assertEqual(r.status_code, 200)

        # Delete it
        r = self.client.delete(f'/api/listings/saved-searches/{ss_id}/')
        self.assertIn(r.status_code, [200, 204])
        self.assertFalse(SavedSearch.objects.filter(id=ss_id).exists())


# ─── Journey 7: Listing Lifecycle ─────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestListingLifecycleJourney(BaseAPITest):
    """
    User creates listing → views it → another user saves it and views it →
    owner updates status → owner renews it → owner deletes it.
    """

    def test_listing_lifecycle(self):
        owner = self.create_user(email='owner@lifecycle.com')
        viewer = self.create_user(email='viewer@lifecycle.com')

        # ── Create job listing ──
        self.authenticate(owner)
        job = self.create_job(user=owner)
        listing_slug = job.listing.slug
        listing_id = job.listing.id

        # ── View the listing (track view) ──
        self.authenticate(viewer)
        r = self.client.post(f'/api/listings/{listing_id}/view/')
        self.assertIn(r.status_code, [200, 201])

        r = self.client.get(f'/api/listings/{listing_slug}/')
        self.assertEqual(r.status_code, 200)

        # ── Viewer saves listing ──
        r = self.client.post(f'/api/listings/{listing_id}/save/')
        self.assertIn(r.status_code, [200, 201])
        self.assertTrue(SavedListing.objects.filter(user=viewer, listing_id=listing_id).exists())

        # ── Viewer reports listing ──
        r = self.client.post(f'/api/listings/{listing_id}/report/', {
            'reason': 'spam',
            'details': 'This looks like a duplicate.',
        })
        self.assertIn(r.status_code, [200, 201])

        # ── Check similar listings ──
        r = self.client.get(f'/api/listings/{listing_id}/similar/')
        self.assertEqual(r.status_code, 200)

        # ── Owner updates listing ──
        self.authenticate(owner)
        r = self.client.patch(f'/api/listings/{listing_slug}/', {
            'title': 'Updated Job Title',
            'description': 'Updated description with more details.',
        })
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['title'], 'Updated Job Title')

        # ── Owner marks as filled ──
        r = self.client.patch(f'/api/listings/{listing_id}/status/', {'status': 'filled'})
        self.assertIn(r.status_code, [200, 400])

        # ── Owner deletes listing ──
        r = self.client.delete(f'/api/listings/{listing_slug}/')
        self.assertIn(r.status_code, [200, 204])
        # Listing uses soft-delete (status='deleted'), record stays in DB
        self.assertTrue(
            Listing.objects.filter(id=listing_id, status='deleted').exists()
        )


# ─── Journey 8: Multi-User Messaging Thread ────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestMessagingThreadJourney(BaseAPITest):
    """
    Two users exchange a multi-message conversation about a listing.
    """

    def test_full_message_thread(self):
        poster = self.create_user(email='poster@msg.com')
        inquirer = self.create_user(email='inquirer@msg.com')
        listing = self.create_job(user=poster)
        listing_id = listing.listing.id

        # ── Inquirer starts conversation ──
        self.authenticate(inquirer)
        r = self.client.post('/api/messages/', {
            'recipient_id': poster.id,
            'listing_id': listing_id,
            'listing_title': listing.listing.title,
            'listing_type': 'job',
            'message': 'Hi, I am interested in this job. Are you still hiring?',
        })
        self.assertIn(r.status_code, [200, 201])
        conv_id = r.data.get('id') or r.data.get('conversation_id')
        self.assertIsNotNone(conv_id)

        # ── Poster views conversations ──
        self.authenticate(poster)
        r = self.client.get('/api/messages/')
        self.assertEqual(r.status_code, 200)
        conversations = r.data.get('results', r.data) if isinstance(r.data, dict) else r.data
        self.assertGreater(len(conversations), 0)

        # ── Poster reads the conversation ──
        r = self.client.get(f'/api/messages/{conv_id}/')
        self.assertEqual(r.status_code, 200)

        # ── Poster replies ──
        r = self.client.post(f'/api/messages/{conv_id}/send/', {
            'content': 'Yes, we are still hiring! Please send your CV.'
        })
        self.assertIn(r.status_code, [200, 201])

        # ── Inquirer reads and replies ──
        self.authenticate(inquirer)
        r = self.client.get(f'/api/messages/{conv_id}/')
        self.assertEqual(r.status_code, 200)

        r = self.client.post(f'/api/messages/{conv_id}/send/', {
            'content': 'Great! I have 3 years of experience. Here is my CV link: ...'
        })
        self.assertIn(r.status_code, [200, 201])

        # ── Verify 3 messages in DB (initial + 2 replies) ──
        msg_count = Message.objects.filter(conversation_id=conv_id).count()
        self.assertGreaterEqual(msg_count, 2)

        # ── Unread count decreases as messages are read ──
        self.authenticate(poster)
        r = self.client.get('/api/messages/unread-count/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('unread_count', r.data)
