"""
Listing CRUD tests — create, list, delete, ownership, public access.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
CREATE_URL = "/api/listings/create/"
LIST_URL = "/api/listings/"


def make_user(email="owner@example.com", password="Pass123!", is_superuser=False):
    u = User.objects.create_user(
        email=email, password=password,
        first_name="Test", last_name="User",
    )
    if is_superuser:
        u.is_staff = True
        u.is_superuser = True
        u.save()
    return u


LISTING_PAYLOAD = {
    "title": "Dishwasher needed at Sydney café",
    "description": "Looking for a reliable dishwasher for weekend shifts.",
    "listing_type": "job",
    "location": "Sydney, NSW",
    "state": "NSW",
    "contact_email": "owner@example.com",
}


class ListingCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def _auth(self):
        res = self.client.post("/api/auth/login/", {
            "email": "owner@example.com",
            "password": "Pass123!",
        })
        token = res.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_unauthenticated_cannot_create(self):
        res = self.client.post(CREATE_URL, LISTING_PAYLOAD)
        self.assertEqual(res.status_code, 401)

    def test_authenticated_user_can_create(self):
        self._auth()
        res = self.client.post(CREATE_URL, LISTING_PAYLOAD)
        self.assertIn(res.status_code, [200, 201])
        self.assertIn("id", res.data)
        self.assertIn("slug", res.data)

    def test_title_required(self):
        self._auth()
        payload = {**LISTING_PAYLOAD, "title": ""}
        res = self.client.post(CREATE_URL, payload)
        self.assertEqual(res.status_code, 400)

    def test_listing_type_required(self):
        self._auth()
        payload = {k: v for k, v in LISTING_PAYLOAD.items() if k != "listing_type"}
        res = self.client.post(CREATE_URL, payload)
        self.assertEqual(res.status_code, 400)


class ListingListTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_listing_list_public(self):
        res = self.client.get(LIST_URL)
        self.assertEqual(res.status_code, 200)
        self.assertIn("results", res.data)

    def test_listing_list_returns_paginated_results(self):
        res = self.client.get(LIST_URL)
        self.assertIn("count", res.data)
        self.assertIn("next", res.data)


class ListingDeleteTests(TestCase):
    def setUp(self):
        self.owner = make_user("owner@example.com")
        self.other = make_user("other@example.com")
        self.client = APIClient()

    def _login(self, email, password="Pass123!"):
        res = self.client.post("/api/auth/login/", {"email": email, "password": password})
        token = res.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def _create_listing(self):
        self._login("owner@example.com")
        res = self.client.post(CREATE_URL, LISTING_PAYLOAD)
        return res.data.get("slug")

    def test_owner_can_delete_their_listing(self):
        slug = self._create_listing()
        self.assertIsNotNone(slug)
        res = self.client.delete(f"/api/listings/{slug}/")
        self.assertIn(res.status_code, [200, 204])

    def test_non_owner_cannot_delete(self):
        slug = self._create_listing()
        self._login("other@example.com")
        res = self.client.delete(f"/api/listings/{slug}/")
        self.assertIn(res.status_code, [403, 404])

    def test_unauthenticated_cannot_delete(self):
        slug = self._create_listing()
        self.client.credentials()  # clear auth
        res = self.client.delete(f"/api/listings/{slug}/")
        self.assertEqual(res.status_code, 401)


class PanelStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.superuser = make_user("admin@example.com", is_superuser=True)
        self.regular = make_user("regular@example.com")

    def _login(self, email):
        res = self.client.post("/api/auth/login/", {"email": email, "password": "Pass123!"})
        token = res.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_regular_user_cannot_access_panel(self):
        self._login("regular@example.com")
        res = self.client.get("/api/panel/stats/")
        self.assertIn(res.status_code, [403, 404])

    def test_superuser_can_access_panel(self):
        self._login("admin@example.com")
        res = self.client.get("/api/panel/stats/")
        self.assertEqual(res.status_code, 200)
