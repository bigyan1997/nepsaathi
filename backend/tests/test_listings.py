"""
Listing CRUD tests — create, list, delete, ownership, public access.
"""
from django.test import override_settings

from .base import BaseAPITest, TEST_SETTINGS

CREATE_URL = "/api/listings/create/"
LIST_URL = "/api/listings/"

LISTING_PAYLOAD = {
    "title": "Dishwasher needed at Sydney café",
    "description": "Looking for a reliable dishwasher for weekend shifts.",
    "listing_type": "job",
    "location": "Sydney, NSW",
    "state": "NSW",
    "contact_email": "owner@example.com",
}


@override_settings(**TEST_SETTINGS)
class ListingCreateTests(BaseAPITest):
    def test_unauthenticated_cannot_create(self):
        res = self.client.post(CREATE_URL, LISTING_PAYLOAD)
        self.assertIn(res.status_code, [401, 403])

    def test_authenticated_user_can_create(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        res = self.client.post(CREATE_URL, LISTING_PAYLOAD)
        self.assertIn(res.status_code, [200, 201])
        self.assertIn("id", res.data)
        self.assertIn("slug", res.data)

    def test_title_required(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        payload = {**LISTING_PAYLOAD, "title": ""}
        res = self.client.post(CREATE_URL, payload)
        self.assertEqual(res.status_code, 400)

    def test_listing_type_required(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        payload = {k: v for k, v in LISTING_PAYLOAD.items() if k != "listing_type"}
        res = self.client.post(CREATE_URL, payload)
        self.assertEqual(res.status_code, 400)


@override_settings(**TEST_SETTINGS)
class ListingListTests(BaseAPITest):
    def test_listing_list_public(self):
        res = self.client.get(LIST_URL)
        self.assertEqual(res.status_code, 200)
        self.assertIn("results", res.data)

    def test_listing_list_returns_paginated_results(self):
        res = self.client.get(LIST_URL)
        self.assertIn("count", res.data)
        self.assertIn("next", res.data)


@override_settings(**TEST_SETTINGS)
class ListingDeleteTests(BaseAPITest):
    def _create_listing_as(self, user):
        self.client.force_authenticate(user=user)
        res = self.client.post(CREATE_URL, LISTING_PAYLOAD)
        return res.data.get("slug")

    def test_owner_can_delete_their_listing(self):
        owner = self.create_user()
        slug = self._create_listing_as(owner)
        self.assertIsNotNone(slug)
        res = self.client.delete(f"/api/listings/{slug}/")
        self.assertIn(res.status_code, [200, 204])

    def test_non_owner_cannot_delete(self):
        owner = self.create_user()
        slug = self._create_listing_as(owner)

        other = self.create_user()
        self.client.force_authenticate(user=other)
        res = self.client.delete(f"/api/listings/{slug}/")
        self.assertIn(res.status_code, [403, 404])

    def test_unauthenticated_cannot_delete(self):
        owner = self.create_user()
        slug = self._create_listing_as(owner)

        self.client.force_authenticate(user=None)
        res = self.client.delete(f"/api/listings/{slug}/")
        self.assertIn(res.status_code, [401, 403])


@override_settings(**TEST_SETTINGS)
class PanelStatsTests(BaseAPITest):
    def test_regular_user_cannot_access_panel(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        res = self.client.get("/api/panel/stats/")
        self.assertIn(res.status_code, [403, 404])

    def test_superuser_can_access_panel(self):
        admin = self.create_user(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=admin)
        res = self.client.get("/api/panel/stats/")
        self.assertEqual(res.status_code, 200)
