import { Link } from "react-router-dom";
import { CreditCardIcon } from "@phosphor-icons/react";

export default function PaymentCancelPage() {
  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
      <CreditCardIcon size={72} weight="duotone" color="#A32D2D" style={{ marginBottom: 16, opacity: 0.75 }} />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#26215C", margin: "0 0 12px" }}>
        Payment cancelled
      </h1>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: "0 0 32px" }}>
        No charge has been made. You can feature your listing any time from My Listings.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/my-listings"
          style={{
            background: "#E87722",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to my listings
        </Link>
        <Link
          to="/"
          style={{
            background: "#F5F4F0",
            color: "#555",
            padding: "12px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
