import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import api from "../../utils/axios";
import { useToast } from "../../components/ui/Toast";

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

function StrengthCheck({ met, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ color: met ? "#27AE60" : "#ccc", fontSize: "13px", lineHeight: 1 }}>
        {met ? "✓" : "○"}
      </span>
      <span style={{ fontSize: "12px", color: met ? "#27AE60" : "#aaa" }}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  usePageTitle("Reset Password");
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ new_password1: "", new_password2: "" });
  const [show, setShow] = useState({ p1: false, p2: false });
  const [touched, setTouched] = useState({ p1: false, p2: false });
  const [loading, setLoading] = useState(false);

  const p = form.new_password1;
  const checks = {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(p),
  };
  const allChecksMet = Object.values(checks).every(Boolean);
  const passwordsMatch = form.new_password1 === form.new_password2;
  const showMismatch = touched.p2 && form.new_password2.length > 0 && !passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ p1: true, p2: true });
    if (!allChecksMet) {
      addToast("Password doesn't meet the requirements.", "error");
      return;
    }
    if (!passwordsMatch) {
      addToast("Passwords don't match.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/password/reset/confirm/", {
        uid,
        token,
        new_password1: form.new_password1,
        new_password2: form.new_password2,
      });
      addToast("Password reset successfully! Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      const detail =
        err.response?.data?.token?.[0] ||
        err.response?.data?.detail ||
        "Invalid or expired reset link.";
      addToast(detail, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    border: hasError ? "1px solid #E53935" : "0.5px solid #ccc",
    borderRadius: "8px",
    padding: "10px 44px 10px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

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
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "8px",
            }}
          >
            Choose new password
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#888",
              marginBottom: "24px",
              lineHeight: 1.6,
            }}
          >
            Enter your new password below.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* New password */}
            <div>
              <label
                htmlFor="rp-p1"
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#444",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                New password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="rp-p1"
                  type={show.p1 ? "text" : "password"}
                  value={form.new_password1}
                  onChange={(e) => setForm({ ...form, new_password1: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, p1: true }))}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={inputStyle(touched.p1 && !allChecksMet && form.new_password1.length > 0)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, p1: !s.p1 }))}
                  aria-label={show.p1 ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#888",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  <EyeIcon open={show.p1} />
                </button>
              </div>

              {/* Strength checklist — shown after user starts typing */}
              {(touched.p1 || form.new_password1.length > 0) && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 12px",
                  }}
                >
                  <StrengthCheck met={checks.length} label="8+ characters" />
                  <StrengthCheck met={checks.upper} label="Uppercase letter" />
                  <StrengthCheck met={checks.number} label="Number" />
                  <StrengthCheck met={checks.special} label="Special character" />
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="rp-p2"
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#444",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Confirm new password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="rp-p2"
                  type={show.p2 ? "text" : "password"}
                  value={form.new_password2}
                  onChange={(e) => setForm({ ...form, new_password2: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, p2: true }))}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  style={inputStyle(showMismatch)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, p2: !s.p2 }))}
                  aria-label={show.p2 ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#888",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  <EyeIcon open={show.p2} />
                </button>
              </div>
              {showMismatch && (
                <p style={{ fontSize: "12px", color: "#E53935", marginTop: "5px" }}>
                  Passwords don't match.
                </p>
              )}
              {touched.p2 && form.new_password2.length > 0 && passwordsMatch && (
                <p style={{ fontSize: "12px", color: "#27AE60", marginTop: "5px" }}>
                  ✓ Passwords match
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
              {loading ? "Resetting..." : "Reset password →"}
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
        </div>
      </div>
    </div>
  );
}
