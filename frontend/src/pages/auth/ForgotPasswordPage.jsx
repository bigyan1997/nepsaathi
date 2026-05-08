import { useState } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import api from "../../utils/axios";
import { useToast } from "../../components/ui/Toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  usePageTitle("Forgot Password");
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = touched && !EMAIL_RE.test(email) ? "Enter a valid email address." : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email)) return;
    setLoading(true);
    try {
      await api.post("/api/auth/password/reset/", { email });
      setSent(true);
    } catch {
      addToast("Failed to send reset email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F4F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "28px", fontWeight: 700 }}>
              <span style={{ color: "#E87722" }}>Nep</span>
              <span style={{ color: "#26215C" }}>Saathi</span>
            </span>
          </Link>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "0.5px solid #e5e5e5",
            padding: "32px",
          }}
        >
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#26215C",
                  marginBottom: "8px",
                }}
              >
                Check your email!
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#888",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                }}
              >
                We've sent a password reset link to <strong>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "20px" }}>
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => { setSent(false); setTouched(false); }}
                style={{
                  background: "#F5F4F0",
                  color: "#534AB7",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#26215C",
                  marginBottom: "8px",
                }}
              >
                Forgot password?
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#888",
                  marginBottom: "24px",
                  lineHeight: 1.6,
                }}
              >
                Enter your email and we'll send you a link to reset your
                password.
              </p>

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div>
                  <label
                    htmlFor="fp-email"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#444",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Email address
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={{
                      width: "100%",
                      border: emailError ? "1px solid #E53935" : "0.5px solid #ccc",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      outline: "none",
                      background: "#fff",
                      color: "#333",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                  />
                  {emailError && (
                    <p style={{ fontSize: "12px", color: "#E53935", marginTop: "5px" }}>
                      {emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading
                      ? "#ccc"
                      : "linear-gradient(135deg, #26215C, #534AB7)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "13px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Sending..." : "Send reset link →"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <Link
                  to="/login"
                  style={{ fontSize: "13px", color: "#534AB7", textDecoration: "none" }}
                >
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
