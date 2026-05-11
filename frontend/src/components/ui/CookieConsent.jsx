import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "nepsaathi_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#26215C",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
      }}
    >
      <p style={{ fontSize: "13px", color: "#C9C4F5", margin: 0, flex: 1, minWidth: "220px", lineHeight: 1.6 }}>
        We use cookies and local storage for authentication and preferences.
        By using NepSaathi you agree to our{" "}
        <Link to="/privacy" style={{ color: "#AFA9EC", textDecoration: "underline" }}>
          Privacy Policy
        </Link>
        .
      </p>

      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            background: "transparent",
            border: "0.5px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            color: "#C9C4F5",
            fontSize: "13px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            background: "#E87722",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
