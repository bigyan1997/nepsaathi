"""
Auth tests — register, login, token refresh, endpoint protection.
"""
from django.test import override_settings
from django.contrib.auth import get_user_model

from .base import BaseAPITest, TEST_SETTINGS

User = get_user_model()


@override_settings(**TEST_SETTINGS)
class RegisterTests(BaseAPITest):
    def test_new_user_can_register(self):
        res = self.client.post("/api/auth/registration/", {
            "email": self._unique_email("newreg"),
            "password1": "TestPass123!",
            "password2": "TestPass123!",
            "first_name": "New",
            "last_name": "User",
        })
        self.assertIn(res.status_code, [200, 201])

    def test_duplicate_email_rejected(self):
        email = self._unique_email("dupe")
        self.create_user(email=email)
        res = self.client.post("/api/auth/registration/", {
            "email": email,
            "password1": "TestPass123!",
            "password2": "TestPass123!",
            "first_name": "Dupe",
            "last_name": "User",
        })
        self.assertEqual(res.status_code, 400)

    def test_mismatched_passwords_rejected(self):
        res = self.client.post("/api/auth/registration/", {
            "email": self._unique_email("mismatch"),
            "password1": "TestPass123!",
            "password2": "DifferentPass123!",
            "first_name": "Mis",
            "last_name": "Match",
        })
        self.assertEqual(res.status_code, 400)

    def test_weak_password_rejected(self):
        res = self.client.post("/api/auth/registration/", {
            "email": self._unique_email("weak"),
            "password1": "123",
            "password2": "123",
            "first_name": "Weak",
            "last_name": "Pass",
        })
        self.assertEqual(res.status_code, 400)


@override_settings(**TEST_SETTINGS)
class LoginTests(BaseAPITest):
    def setUp(self):
        self.login_email = self._unique_email("login")
        self.user = self.create_user(email=self.login_email, password="TestPass123!")

    def test_login_returns_tokens(self):
        res = self.client.post("/api/auth/login/", {
            "email": self.login_email,
            "password": "TestPass123!",
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_wrong_password_rejected(self):
        res = self.client.post("/api/auth/login/", {
            "email": self.login_email,
            "password": "WrongPass999!",
        })
        self.assertEqual(res.status_code, 400)

    def test_nonexistent_email_rejected(self):
        res = self.client.post("/api/auth/login/", {
            "email": self._unique_email("ghost") + ".nonexistent",
            "password": "TestPass123!",
        })
        self.assertEqual(res.status_code, 400)


@override_settings(**TEST_SETTINGS)
class TokenRefreshTests(BaseAPITest):
    def test_valid_refresh_returns_new_access_token(self):
        email = self._unique_email("refresh")
        self.create_user(email=email, password="TestPass123!")
        res = self.client.post("/api/auth/login/", {"email": email, "password": "TestPass123!"})
        refresh = res.data.get("refresh")
        res2 = self.client.post("/api/auth/token/refresh/", {"refresh": refresh})
        self.assertIn(res2.status_code, [200, 201])
        self.assertIn("access", res2.data)

    def test_invalid_refresh_token_rejected(self):
        res = self.client.post("/api/auth/token/refresh/", {"refresh": "notavalidtoken"})
        self.assertIn(res.status_code, [400, 401])


@override_settings(**TEST_SETTINGS)
class AuthEndpointProtectionTests(BaseAPITest):
    def test_profile_requires_auth(self):
        res = self.client.get("/api/auth/user/")
        self.assertIn(res.status_code, [401, 403])

    def test_my_listings_requires_auth(self):
        res = self.client.get("/api/listings/my-listings/")
        self.assertIn(res.status_code, [401, 403])

    def test_listing_list_is_public(self):
        res = self.client.get("/api/listings/")
        self.assertEqual(res.status_code, 200)
