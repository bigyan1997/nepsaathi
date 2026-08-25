import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPaymentStatus } from "../../api/payments";
import { HourglassMediumIcon, WarningIcon, ConfettiIcon, CheckCircleIcon } from "@phosphor-icons/react";

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const listingId = params.get("listing_id");

  const [confirmed, setConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!listingId) { setConfirmed(true); return; }

    let cancelled = false;
    let attempts = 0;
    const MAX = 20;

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await getPaymentStatus(listingId);
        if (data?.is_featured) {
          if (!cancelled) setConfirmed(true);
          return;
        }
      } catch (_) {}

      if (cancelled) return;
      attempts += 1;
      if (attempts >= MAX) {
        setTimedOut(true);
        return;
      }
      setTimeout(poll, 1500);
    };

    poll();
    return () => { cancelled = true; };
  }, [listingId]);

  if (!confirmed && !timedOut) {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <HourglassMediumIcon size={56} weight="duotone" color="#534AB7" style={{ marginBottom: 16, opacity: 0.8 }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#26215C", margin: "0 0 12px" }}>
          Confirming your payment…
        </h1>
        <p style={{ fontSize: 14, color: "#666" }}>
          This usually takes just a few seconds. Please don't close this page.
        </p>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <WarningIcon size={56} weight="duotone" color="#D97706" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#26215C", margin: "0 0 12px" }}>
          Payment received — still processing
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: "0 0 24px" }}>
          Your payment went through but the listing hasn't updated yet.
          Check your listings in a minute — if it's still not featured,
          contact <a href="mailto:support@nepsaathi.com" style={{ color: "#534AB7" }}>support@nepsaathi.com</a>.
        </p>
        <Link to="/my-listings" style={{ background: "#534AB7", color: "#fff", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          View my listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
      <ConfettiIcon size={72} weight="duotone" color="#16a34a" style={{ marginBottom: 16 }} />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#26215C", margin: "0 0 12px" }}>
        Your listing is now featured!
      </h1>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: "0 0 32px" }}>
        Your listing will appear at the top of search results for the next 7 days,
        reaching more people in the NepSaathi community.
      </p>
      <div style={{
        background: "#E1F5EE",
        border: "1px solid #9FE1CB",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 28,
        fontSize: 13,
        color: "#085041",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}>
        <CheckCircleIcon size={14} weight="fill" color="#085041" style={{ flexShrink: 0 }} />Payment confirmed · Featured for 7 days · Visible at the top of search results
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/my-listings"
          style={{ background: "#534AB7", color: "#fff", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          View my listings
        </Link>
        <Link
          to="/"
          style={{ background: "#F5F4F0", color: "#555", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
