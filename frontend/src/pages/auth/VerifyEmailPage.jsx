import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../utils/axios";
import usePageTitle from "../../hooks/usePageTitle";

export default function VerifyEmailPage() {
  usePageTitle("Verify Email");
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  const [status, setStatus] = useState("verifying"); // verifying | success | error

  useEffect(() => {
    if (!key) {
      setStatus("error");
      return;
    }
    api
      .post("/api/auth/registration/verify-email/", { key })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [key]);

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        {status === "verifying" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#26215C" }}>
              Verifying your email...
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#26215C", marginBottom: "8px" }}>
              Email verified!
            </h1>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, marginBottom: "28px" }}>
              Your account is now active. Sign in to get started.
            </p>
            <Link
              to="/login"
              style={{
                background: "#E87722",
                color: "#fff",
                padding: "12px 32px",
                borderRadius: "9px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                display: "inline-block",
              }}
            >
              Sign in →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#26215C", marginBottom: "8px" }}>
              Verification failed
            </h1>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, marginBottom: "28px" }}>
              This link may have expired or already been used. Try registering again.
            </p>
            <Link
              to="/register"
              style={{
                background: "#534AB7",
                color: "#fff",
                padding: "12px 32px",
                borderRadius: "9px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                display: "inline-block",
              }}
            >
              Register again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
