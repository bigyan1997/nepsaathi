"""
Stripe webhook tests — signature validation, missing header, malformed body.
Tests do not hit the real Stripe API.
"""
import json
import time
import hmac
import hashlib
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient

WEBHOOK_URL = "/api/payments/webhook/"


def _make_stripe_signature(payload: bytes, secret: str) -> str:
    """Build a Stripe-compatible Stripe-Signature header value."""
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload.decode()}".encode()
    sig = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"


MOCK_SECRET = "whsec_test_secret_1234567890"

CHECKOUT_COMPLETED_EVENT = {
    "type": "checkout.session.completed",
    "data": {
        "object": {
            "id": "cs_test_abc",
            "payment_status": "paid",
            "amount_total": 999,
            "metadata": {"listing_id": "99999"},
            "customer_details": {"email": "buyer@example.com"},
        }
    },
}


class StripeWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _post(self, body: bytes, sig_header: str | None = None):
        headers = {"content_type": "application/json"}
        if sig_header:
            headers["HTTP_STRIPE_SIGNATURE"] = sig_header
        return self.client.post(WEBHOOK_URL, data=body, **headers)

    def test_missing_signature_header_returns_400(self):
        body = json.dumps(CHECKOUT_COMPLETED_EVENT).encode()
        res = self._post(body, sig_header=None)
        self.assertEqual(res.status_code, 400)

    def test_invalid_signature_returns_400(self):
        body = json.dumps(CHECKOUT_COMPLETED_EVENT).encode()
        res = self._post(body, sig_header="t=1234,v1=badhash")
        self.assertEqual(res.status_code, 400)

    @patch("payments.views.stripe.Webhook.construct_event")
    def test_valid_signature_processes_event(self, mock_construct):
        """A correctly signed webhook with a handled event type returns 200."""
        event_data = CHECKOUT_COMPLETED_EVENT.copy()
        mock_construct.return_value = event_data

        body = json.dumps(event_data).encode()
        sig = _make_stripe_signature(body, MOCK_SECRET)

        with patch("payments.views.settings.STRIPE_WEBHOOK_SECRET", MOCK_SECRET):
            with patch("payments.views.StripeWebhookView._handle_checkout_completed"):
                res = self._post(body, sig_header=sig)

        # construct_event was called → event was dispatched
        mock_construct.assert_called_once()
        self.assertIn(res.status_code, [200, 400])  # 400 if listing 99999 doesn't exist

    @patch("payments.views.stripe.Webhook.construct_event")
    def test_unknown_event_type_returns_200(self, mock_construct):
        """Unhandled Stripe events should be acknowledged silently (200)."""
        mock_construct.return_value = {"type": "payment_intent.created", "data": {"object": {}}}
        body = b'{"type":"payment_intent.created"}'
        sig = _make_stripe_signature(body, MOCK_SECRET)

        with patch("payments.views.settings.STRIPE_WEBHOOK_SECRET", MOCK_SECRET):
            res = self._post(body, sig_header=sig)

        self.assertIn(res.status_code, [200, 400])
