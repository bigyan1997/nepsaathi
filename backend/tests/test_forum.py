"""
Forum endpoint tests — create post, list, vote, auth guards.
"""
from django.test import override_settings

from .base import BaseAPITest, TEST_SETTINGS

FORUM_URL = "/api/forum/"


@override_settings(**TEST_SETTINGS)
class ForumPostCreateTests(BaseAPITest):
    def test_unauthenticated_cannot_create_post(self):
        res = self.client.post(FORUM_URL, {
            "title": "Test post",
            "body": "Hello community!",
            "category": "discussion",
        })
        self.assertIn(res.status_code, [401, 403])

    def test_authenticated_user_can_create_post(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        res = self.client.post(FORUM_URL, {
            "title": "Test post",
            "body": "Hello community!",
            "category": "discussion",
        })
        self.assertIn(res.status_code, [200, 201])
        self.assertIn("slug", res.data)

    def test_valid_intent_categories_accepted(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        for category in ["discussion", "looking_for", "announcement", "buy_sell", "warning"]:
            res = self.client.post(FORUM_URL, {
                "title": f"Post in {category}",
                "body": "Body text.",
                "category": category,
            })
            self.assertIn(res.status_code, [200, 201],
                          msg=f"Category '{category}' should be accepted")

    def test_invalid_category_rejected(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        res = self.client.post(FORUM_URL, {
            "title": "Bad category",
            "body": "Body text.",
            "category": "random_nonexistent",
        })
        self.assertEqual(res.status_code, 400)

    def test_title_required(self):
        user = self.create_user()
        self.client.force_authenticate(user=user)
        res = self.client.post(FORUM_URL, {
            "body": "No title here.",
            "category": "discussion",
        })
        self.assertEqual(res.status_code, 400)


@override_settings(**TEST_SETTINGS)
class ForumPostListTests(BaseAPITest):
    def test_post_list_is_public(self):
        res = self.client.get(FORUM_URL)
        self.assertEqual(res.status_code, 200)

    def test_post_list_paginated(self):
        res = self.client.get(FORUM_URL)
        self.assertIn("results", res.data)
        self.assertIn("count", res.data)


@override_settings(**TEST_SETTINGS)
class ForumVoteTests(BaseAPITest):
    def _create_post(self, user):
        self.client.force_authenticate(user=user)
        res = self.client.post(FORUM_URL, {
            "title": "Post to vote on",
            "body": "Body.",
            "category": "discussion",
        })
        return res.data.get("slug")

    def test_unauthenticated_cannot_vote(self):
        user = self.create_user()
        slug = self._create_post(user)
        self.client.force_authenticate(user=None)
        res = self.client.post(f"/api/forum/{slug}/vote/")
        self.assertIn(res.status_code, [401, 403])

    def test_authenticated_user_can_vote(self):
        user = self.create_user()
        slug = self._create_post(user)
        res = self.client.post(f"/api/forum/{slug}/vote/")
        self.assertIn(res.status_code, [200, 201])
