import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import usePageTitle from "../../hooks/usePageTitle";

export default function LoginPage() {
  usePageTitle("Sign In");
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Where were they trying to go before login?
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(form.email, form.password);
      setAuth(data.user, data.access, data.refresh);
      navigate(from, { replace: true }); // ← send them back where they came from
    } catch (err) {
      const status = err.response?.status;
      const errors = err.response?.data;
      if (status === 400) {
        if (errors?.non_field_errors) {
          setError(errors.non_field_errors[0]);
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else if (status === 404) {
        setError("No account found with this email. Please register first.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          padding: "36px",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{ position: "relative", width: "32px", height: "24px" }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 1,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#E87722",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "9px",
                  top: 1,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#534AB7",
                  opacity: 0.88,
                }}
              />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 600 }}>
              <span style={{ color: "#E87722" }}>Nep</span>
              <span style={{ color: "#26215C" }}>Saathi</span>
            </span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#26215C" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            Sign in to your NepSaathi account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#A32D2D",
              marginBottom: "16px",
            }}
          >
            {error}
            {error.includes("Invalid email or password") && (
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                Forgot your password? Email us at{" "}
                <a
                  href="mailto:support@nepsaathi.com"
                  style={{ color: "#A32D2D", fontWeight: 600 }}
                >
                  support@nepsaathi.com
                </a>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
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
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: "0.5px solid #ccc",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "14px",
                outline: "none",
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
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  border: "0.5px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  paddingRight: "44px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#ccc" : "#534AB7",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "4px",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "16px 0",
          }}
        >
          <div style={{ flex: 1, height: "0.5px", background: "#e5e5e5" }} />
          <span style={{ fontSize: "12px", color: "#aaa" }}>or</span>
          <div style={{ flex: 1, height: "0.5px", background: "#e5e5e5" }} />
        </div>

        <GoogleLoginButton redirectTo={from} />

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#888",
            marginTop: "20px",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#E87722",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Register free
          </Link>
        </p>
      </div>
    </div>
  );
}
