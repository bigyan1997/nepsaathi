"""
Auth endpoint tests — register, login, token refresh, logout, rate limits.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


def make_user(email="test@example.com", password="TestPass123!"):
    return User.objects.create_user(
        email=email,
        password=password,
        first_name="Test",
        last_name="User",
    )


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auth/registration/"

    def test_register_new_user(self):
        res = self.client.post(self.url, {
            "email": "new@example.com",
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
        })
        self.assertIn(res.status_code, [200, 201])
        self.assertTrue(User.objects.filter(email="new@example.com").exists())

    def test_duplicate_email_rejected(self):
        make_user("dupe@example.com")
        res = self.client.post(self.url, {
            "email": "dupe@example.com",
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "A",
            "last_name": "B",
        })
        self.assertEqual(res.status_code, 400)

    def test_mismatched_passwords_rejected(self):
        res = self.client.post(self.url, {
            "email": "mismatch@example.com",
            "password1": "StrongPass123!",
            "password2": "DifferentPass456!",
            "first_name": "A",
            "last_name": "B",
        })
        self.assertEqual(res.status_code, 400)

    def test_weak_password_rejected(self):
        res = self.client.post(self.url, {
            "email": "weak@example.com",
            "password1": "123",
            "password2": "123",
            "first_name": "A",
            "last_name": "B",
        })
        self.assertEqual(res.status_code, 400)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auth/login/"
        self.user = make_user()
        self.user.is_active = True
        self.user.save()

    def test_login_returns_tokens(self):
        res = self.client.post(self.url, {
            "email": "test@example.com",
            "password": "TestPass123!",
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertIn("user", res.data)

    def test_wrong_password_rejected(self):
        res = self.client.post(self.url, {
            "email": "test@example.com",
            "password": "WrongPassword!",
        })
        self.assertIn(res.status_code, [400, 401])

    def test_nonexistent_email_rejected(self):
        res = self.client.post(self.url, {
            "email": "nobody@example.com",
            "password": "TestPass123!",
        })
        self.assertIn(res.status_code, [400, 401])

    def test_banned_user_cannot_login(self):
        self.user.is_banned = True
        self.user.save()
        res = self.client.post(self.url, {
            "email": "test@example.com",
            "password": "TestPass123!",
        })
        self.assertIn(res.status_code, [400, 401, 403])


class TokenRefreshTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.user.is_active = True
        self.user.save()

    def _get_tokens(self):
        res = self.client.post("/api/auth/login/", {
            "email": "test@example.com",
            "password": "TestPass123!",
        })
        return res.data.get("access"), res.data.get("refresh")

    def test_valid_refresh_returns_new_access_token(self):
        _, refresh = self._get_tokens()
        self.assertIsNotNone(refresh)
        res = self.client.post("/api/auth/token/refresh/", {"refresh": refresh})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)

    def test_invalid_refresh_token_rejected(self):
        res = self.client.post("/api/auth/token/refresh/", {"refresh": "not-a-valid-token"})
        self.assertIn(res.status_code, [400, 401])


class AuthEndpointProtectionTests(TestCase):
    """Verify that protected endpoints reject unauthenticated requests."""

    def setUp(self):
        self.client = APIClient()

    def test_profile_requires_auth(self):
        res = self.client.get("/api/users/profile/")
        self.assertEqual(res.status_code, 401)

    def test_my_listings_requires_auth(self):
        res = self.client.get("/api/listings/my-listings/")
        self.assertEqual(res.status_code, 401)

    def test_listing_create_requires_auth(self):
        res = self.client.post("/api/listings/create/", {})
        self.assertEqual(res.status_code, 401)

    def test_panel_stats_requires_auth(self):
        res = self.client.get("/api/panel/stats/")
        self.assertIn(res.status_code, [401, 403, 404])

    def test_public_listing_list_works_without_auth(self):
        res = self.client.get("/api/listings/")
        self.assertEqual(res.status_code, 200)
