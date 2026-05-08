"""
Integration Tests — verify that API endpoints interact correctly with the
database: cascade deletes, model relationships, slug generation, constraints.
"""
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone

from businesses.models import Business, BusinessReview
from events.models import Event, EventRSVP
from jobs.models import Job
from listings.models import Listing, ListingReport, SavedListing, SavedSearch
from messaging.models import Conversation, Message
from rooms.models import Room
from users.models import User

from .base import BaseAPITest, TEST_SETTINGS


@override_settings(**TEST_SETTINGS)
class TestListingIntegration(BaseAPITest):
    """Verify Listing model behaviour through the API layer."""

    def test_listing_slug_generated_on_create(self):
        job = self.create_job()
        self.assertIsNotNone(job.listing.slug)
        self.assertIn(str(job.listing.id), job.listing.slug)

    def test_two_listings_with_same_title_get_unique_slugs(self):
        user = self.create_user()
        j1 = self.create_job(user=user)
        j2 = self.create_job(user=user)
        j1.listing.title = 'Same Title'
        j1.listing.slug = ''
        j1.listing.save()
        j2.listing.title = 'Same Title'
        j2.listing.slug = ''
        j2.listing.save()
        self.assertNotEqual(j1.listing.slug, j2.listing.slug)

    def test_listing_cascades_delete_to_job(self):
        job = self.create_job()
        listing_id = job.listing.id
        job.listing.delete()
        self.assertFalse(Job.objects.filter(listing_id=listing_id).exists())

    def test_listing_cascades_delete_to_saved_listings(self):
        user = self.create_user()
        job = self.create_job()
        SavedListing.objects.create(user=user, listing=job.listing)
        job.listing.delete()
        self.assertFalse(SavedListing.objects.filter(user=user).exists())

    def test_listing_cascades_delete_to_reports(self):
        user = self.create_user()
        job = self.create_job()
        ListingReport.objects.create(user=user, listing=job.listing, reason='spam')
        job.listing.delete()
        self.assertFalse(ListingReport.objects.filter(user=user).exists())

    def test_user_cascade_deletes_listings(self):
        user = self.create_user()
        job = self.create_job(user=user)
        listing_id = job.listing.id
        user.delete()
        self.assertFalse(Listing.objects.filter(id=listing_id).exists())

    def test_save_listing_unique_per_user(self):
        user = self.create_user()
        job = self.create_job()
        SavedListing.objects.create(user=user, listing=job.listing)
        with self.assertRaises(Exception):
            SavedListing.objects.create(user=user, listing=job.listing)

    def test_save_listing_via_api_and_verify_in_db(self):
        user = self.authenticate()
        job = self.create_job()
        self.client.post(f'/api/listings/{job.listing.id}/save/')
        self.assertTrue(SavedListing.objects.filter(user=user, listing=job.listing).exists())

    def test_delete_removes_existing_save(self):
        user = self.authenticate()
        job = self.create_job()
        self.client.post(f'/api/listings/{job.listing.id}/save/')
        self.assertTrue(SavedListing.objects.filter(user=user, listing=job.listing).exists())
        self.client.delete(f'/api/listings/{job.listing.id}/save/')
        self.assertFalse(SavedListing.objects.filter(user=user, listing=job.listing).exists())

    def test_report_listing_unique_per_user(self):
        user = self.create_user()
        job = self.create_job()
        ListingReport.objects.create(user=user, listing=job.listing, reason='spam')
        with self.assertRaises(Exception):
            ListingReport.objects.create(user=user, listing=job.listing, reason='fake')

    def test_report_via_api_creates_db_record(self):
        user = self.authenticate()
        job = self.create_job()
        self.client.post(f'/api/listings/{job.listing.id}/report/', {'reason': 'spam', 'details': ''})
        self.assertTrue(ListingReport.objects.filter(user=user, listing=job.listing).exists())

    def test_listing_view_tracking_creates_record(self):
        from listings.models import ListingView
        job = self.create_job()
        self.client.post(
            f'/api/listings/{job.listing.id}/view/',
            REMOTE_ADDR='1.2.3.4',
        )
        self.assertTrue(ListingView.objects.filter(listing=job.listing).exists())


@override_settings(**TEST_SETTINGS)
class TestJobIntegration(BaseAPITest):

    def test_job_linked_to_listing_one_to_one(self):
        job = self.create_job()
        self.assertEqual(job.listing.listing_type, Listing.ListingType.JOB)
        self.assertEqual(job.listing.job_detail, job)

    def test_job_salary_display_property(self):
        job = self.create_job()
        self.assertIn('$', job.salary_display)

    def test_job_negotiable_salary_display(self):
        job = self.create_job(salary=None, salary_type=Job.SalaryType.NEGOTIABLE)
        self.assertEqual(job.salary_display, 'Negotiable')

    def test_update_job_via_api_persists_to_db(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        self.client.patch(f'/api/jobs/{job.id}/', {'company_name': 'New Corp'})
        job.refresh_from_db()
        self.assertEqual(job.company_name, 'New Corp')

    def test_delete_job_via_api_removes_job_detail(self):
        user = self.authenticate()
        job = self.create_job(user=user)
        job_id = job.id
        listing_id = job.listing.id
        r = self.client.delete(f'/api/jobs/{job.id}/')
        self.assertIn(r.status_code, [200, 204])
        # Deleting the job detail removes the Job row; base Listing may still exist
        self.assertFalse(Job.objects.filter(id=job_id).exists())


@override_settings(**TEST_SETTINGS)
class TestRoomIntegration(BaseAPITest):

    def test_room_linked_to_listing_one_to_one(self):
        room = self.create_room()
        self.assertEqual(room.listing.listing_type, Listing.ListingType.ROOM)
        self.assertEqual(room.listing.room_detail, room)

    def test_room_price_display(self):
        room = self.create_room()
        self.assertIn('/wk', room.price_display)

    def test_update_room_price_via_api(self):
        user = self.authenticate()
        room = self.create_room(user=user)
        self.client.patch(f'/api/rooms/{room.id}/', {'price': '350.00'})
        room.refresh_from_db()
        self.assertEqual(room.price, Decimal('350.00'))


@override_settings(**TEST_SETTINGS)
class TestEventIntegration(BaseAPITest):

    def test_event_linked_to_listing_one_to_one(self):
        event = self.create_event()
        self.assertEqual(event.listing.listing_type, Listing.ListingType.EVENT)

    def test_event_rsvp_unique_per_user(self):
        event = self.create_event()
        user = self.create_user()
        EventRSVP.objects.create(event=event, user=user)
        with self.assertRaises(Exception):
            EventRSVP.objects.create(event=event, user=user)

    def test_rsvp_via_api_creates_db_record(self):
        user = self.authenticate()
        event = self.create_event()
        self.client.post(f'/api/events/{event.id}/rsvp/')
        self.assertTrue(EventRSVP.objects.filter(event=event, user=user).exists())

    def test_rsvp_toggle_removes_existing_rsvp(self):
        user = self.authenticate()
        event = self.create_event()
        self.client.post(f'/api/events/{event.id}/rsvp/')
        self.client.post(f'/api/events/{event.id}/rsvp/')
        self.assertFalse(EventRSVP.objects.filter(event=event, user=user).exists())

    def test_event_is_upcoming_property(self):
        from datetime import timedelta
        future_event = self.create_event()
        self.assertTrue(future_event.is_upcoming)

    def test_event_rsvp_count_property(self):
        event = self.create_event()
        user = self.create_user()
        EventRSVP.objects.create(event=event, user=user)
        self.assertEqual(event.rsvp_count, 1)


@override_settings(**TEST_SETTINGS)
class TestBusinessIntegration(BaseAPITest):

    def test_business_slug_generated_on_create(self):
        biz = self.create_business()
        self.assertIsNotNone(biz.slug)
        self.assertIn(str(biz.id), biz.slug)

    def test_review_unique_per_user_per_business(self):
        user = self.create_user()
        biz = self.create_business()
        BusinessReview.objects.create(business=biz, reviewer=user, rating=5)
        with self.assertRaises(Exception):
            BusinessReview.objects.create(business=biz, reviewer=user, rating=3)

    def test_review_via_api_creates_db_record(self):
        user = self.authenticate()
        biz = self.create_business()
        self.client.post(f'/api/businesses/{biz.slug}/reviews/', {'rating': 4, 'comment': 'Good'})
        self.assertTrue(BusinessReview.objects.filter(business=biz, reviewer=user).exists())

    def test_business_cascade_delete_removes_reviews(self):
        biz = self.create_business()
        user = self.create_user()
        BusinessReview.objects.create(business=biz, reviewer=user, rating=5)
        biz_id = biz.id
        biz.delete()
        self.assertFalse(BusinessReview.objects.filter(business_id=biz_id).exists())

    def test_owner_delete_cascades_to_businesses(self):
        user = self.create_user()
        biz = self.create_business(user=user)
        biz_id = biz.id
        user.delete()
        self.assertFalse(Business.objects.filter(id=biz_id).exists())


@override_settings(**TEST_SETTINGS)
class TestMessagingIntegration(BaseAPITest):

    def test_conversation_participants_many_to_many(self):
        u1 = self.create_user()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        self.assertEqual(conv.participants.count(), 2)

    def test_message_linked_to_conversation(self):
        u1 = self.create_user()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        msg = self.send_message(conv, sender=u1)
        self.assertEqual(msg.conversation, conv)

    def test_messages_ordered_by_created_at(self):
        u1 = self.create_user()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        m1 = self.send_message(conv, u1, 'First')
        m2 = self.send_message(conv, u2, 'Second')
        msgs = list(conv.messages.all())
        self.assertEqual(msgs[0], m1)
        self.assertEqual(msgs[1], m2)

    def test_send_message_via_api_creates_db_record(self):
        u1 = self.authenticate()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        self.client.post(f'/api/messages/{conv.id}/send/', {'content': 'Hi there!'})
        self.assertTrue(Message.objects.filter(conversation=conv, sender=u1).exists())

    def test_conversation_cascade_delete_removes_messages(self):
        u1 = self.create_user()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        self.send_message(conv, u1)
        conv_id = conv.id
        conv.delete()
        self.assertFalse(Message.objects.filter(conversation_id=conv_id).exists())

    def test_other_participant_helper(self):
        u1 = self.create_user()
        u2 = self.create_user()
        conv = self.create_conversation(user1=u1, user2=u2)
        self.assertEqual(conv.other_participant(u1), u2)
        self.assertEqual(conv.other_participant(u2), u1)


@override_settings(**TEST_SETTINGS)
class TestUserModelIntegration(BaseAPITest):

    def test_email_is_unique(self):
        self.create_user(email='unique@test.com')
        with self.assertRaises(Exception):
            self.create_user(email='unique@test.com')

    def test_full_name_property(self):
        user = self.create_user(first_name='Raj', last_name='Sharma')
        self.assertEqual(user.full_name, 'Raj Sharma')

    def test_full_name_handles_empty(self):
        user = self.create_user(first_name='', last_name='')
        self.assertEqual(user.full_name, '')

    def test_banned_user_flag(self):
        user = self.create_banned_user()
        self.assertTrue(user.is_banned)

    def test_profile_update_persists_to_db(self):
        user = self.authenticate()
        self.client.patch('/api/users/profile/', {'phone': '+61412345678'})
        user.refresh_from_db()
        self.assertEqual(user.phone, '+61412345678')

    def test_delete_account_removes_user_from_db(self):
        user = self.authenticate()
        user_id = user.id
        self.client.delete('/api/users/delete-account/')
        self.assertFalse(User.objects.filter(id=user_id).exists())


@override_settings(**TEST_SETTINGS)
class TestSavedSearchIntegration(BaseAPITest):

    def test_saved_search_created_via_api(self):
        user = self.authenticate()
        self.client.post('/api/listings/saved-searches/', {
            'label': 'NSW Jobs',
            'listing_type': 'job',
            'filters': {},
        }, format='json')
        self.assertTrue(SavedSearch.objects.filter(user=user, listing_type='job').exists())

    def test_saved_search_delete_via_api(self):
        user = self.authenticate()
        ss = SavedSearch.objects.create(user=user, listing_type='room', label='Rooms')
        self.client.delete(f'/api/listings/saved-searches/{ss.id}/')
        self.assertFalse(SavedSearch.objects.filter(id=ss.id).exists())

    def test_saved_search_cascade_on_user_delete(self):
        user = self.create_user()
        SavedSearch.objects.create(user=user, listing_type='job')
        user_id = user.id
        user.delete()
        self.assertFalse(SavedSearch.objects.filter(user_id=user_id).exists())
