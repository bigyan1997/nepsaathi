import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import api from "../../utils/axios";
import { useToast } from "../../components/ui/Toast";

export default function ResetPasswordPage() {
  usePageTitle("Reset Password");
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ new_password1: "", new_password2: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.new_password1 || !form.new_password2) {
      addToast("Please fill in both fields.", "error");
      return;
    }
    if (form.new_password1 !== form.new_password2) {
      addToast("Passwords don't match.", "error");
      return;
    }
    if (form.new_password1.length < 8) {
      addToast("Password must be at least 8 characters.", "error");
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
            <div>
              <label
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
              <input
                type="password"
                value={form.new_password1}
                onChange={(e) =>
                  setForm({ ...form, new_password1: e.target.value })
                }
                placeholder="At least 8 characters"
                style={{
                  width: "100%",
                  border: "0.5px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
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
              <input
                type="password"
                value={form.new_password2}
                onChange={(e) =>
                  setForm({ ...form, new_password2: e.target.value })
                }
                placeholder="Repeat your password"
                style={{
                  width: "100%",
                  border: "0.5px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
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
              style={{
                fontSize: "13px",
                color: "#534AB7",
                textDecoration: "none",
              }}
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
