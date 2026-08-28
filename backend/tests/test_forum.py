"""
Forum endpoint tests — create post, list, reply, upvote, auth guards.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
POSTS_URL = "/api/forum/posts/"


def make_user(email="forumuser@example.com", password="Pass123!"):
    return User.objects.create_user(
        email=email, password=password,
        first_name="Forum", last_name="User",
    )


class ForumPostCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def _auth(self):
        res = self.client.post("/api/auth/login/", {
            "email": "forumuser@example.com",
            "password": "Pass123!",
        })
        token = res.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_unauthenticated_cannot_create_post(self):
        res = self.client.post(POSTS_URL, {
            "title": "Test post",
            "body": "Hello community!",
            "category": "discussion",
        })
        self.assertEqual(res.status_code, 401)

    def test_authenticated_user_can_create_post(self):
        self._auth()
        res = self.client.post(POSTS_URL, {
            "title": "Test post",
            "body": "Hello community!",
            "category": "discussion",
        })
        self.assertIn(res.status_code, [200, 201])
        self.assertIn("slug", res.data)

    def test_valid_intent_categories_accepted(self):
        self._auth()
        for category in ["discussion", "looking_for", "announcement", "buy_sell", "warning"]:
            res = self.client.post(POSTS_URL, {
                "title": f"Post in {category}",
                "body": "Body text.",
                "category": category,
            })
            self.assertIn(res.status_code, [200, 201],
                          msg=f"Category '{category}' should be accepted")

    def test_invalid_category_rejected(self):
        self._auth()
        res = self.client.post(POSTS_URL, {
            "title": "Bad category",
            "body": "Body text.",
            "category": "random_nonexistent",
        })
        self.assertEqual(res.status_code, 400)

    def test_title_required(self):
        self._auth()
        res = self.client.post(POSTS_URL, {
            "body": "No title here.",
            "category": "discussion",
        })
        self.assertEqual(res.status_code, 400)


class ForumPostListTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_post_list_is_public(self):
        res = self.client.get(POSTS_URL)
        self.assertEqual(res.status_code, 200)

    def test_post_list_paginated(self):
        res = self.client.get(POSTS_URL)
        self.assertIn("results", res.data)
        self.assertIn("count", res.data)


class ForumUpvoteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def _auth(self):
        res = self.client.post("/api/auth/login/", {
            "email": "forumuser@example.com",
            "password": "Pass123!",
        })
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {res.data.get('access')}"
        )

    def _create_post(self):
        self._auth()
        res = self.client.post(POSTS_URL, {
            "title": "Post to upvote",
            "body": "Body.",
            "category": "discussion",
        })
        return res.data.get("id")

    def test_unauthenticated_cannot_upvote(self):
        post_id = self._create_post()
        self.client.credentials()  # clear auth
        res = self.client.post(f"/api/forum/posts/{post_id}/upvote/")
        self.assertEqual(res.status_code, 401)

    def test_authenticated_user_can_upvote(self):
        post_id = self._create_post()
        res = self.client.post(f"/api/forum/posts/{post_id}/upvote/")
        self.assertIn(res.status_code, [200, 201])
