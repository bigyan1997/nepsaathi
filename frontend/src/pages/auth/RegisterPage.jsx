import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { register } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import usePageTitle from "../../hooks/usePageTitle";

export default function RegisterPage() {
  usePageTitle("Create Account");
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordMatch =
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword;

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };
  const passwordStrong =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordChecks.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!passwordStrong) {
      setError(
        "Password must be at least 8 characters with one uppercase letter, one number and one special character.",
      );
      return;
    }
    if (!passwordMatch) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await register(form);
      setAuth(data.user, data.access, data.refresh);
      navigate("/");
    } catch (err) {
      const errors = err.response?.data;
      if (errors?.email) {
        const msg = errors.email[0];
        if (msg.toLowerCase().includes("already")) {
          setError(
            "This email is already registered. Please sign in or reset your password.",
          );
        } else {
          setError(msg);
        }
      } else if (errors?.password1) setError(errors.password1[0]);
      else if (errors?.non_field_errors) setError(errors.non_field_errors[0]);
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "0.5px solid #ccc",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#444",
    display: "block",
    marginBottom: "6px",
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
            Create account
          </h1>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            Join the NepSaathi community — it's free
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
            {error.includes("already registered") && (
              <div style={{ marginTop: "8px" }}>
                <Link to="/login" style={{ color: "#A32D2D", fontWeight: 600 }}>
                  Sign in →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          {/* Name row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>First name</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="John"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Last name</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Doe"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  paddingRight: "44px",
                  borderColor: form.password
                    ? passwordStrong
                      ? "#1D9E75"
                      : "#F09595"
                    : "#ccc",
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
            {/* Password strength indicator */}
            {form.password && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {[
                  { key: "length", label: "At least 8 characters" },
                  { key: "uppercase", label: "One uppercase letter (A-Z)" },
                  { key: "number", label: "One number (0-9)" },
                  { key: "special", label: "One special character (!@#$%^&*)" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: passwordChecks[key] ? "#1D9E75" : "#aaa",
                        fontWeight: passwordChecks[key] ? 600 : 400,
                      }}
                    >
                      {passwordChecks[key] ? "✓" : "○"}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: passwordChecks[key] ? "#1D9E75" : "#aaa",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  paddingRight: "44px",
                  borderColor: form.confirmPassword
                    ? passwordMatch
                      ? "#1D9E75"
                      : "#F09595"
                    : "#ccc",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
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
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
            {/* Match indicator */}
            {form.confirmPassword && (
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: passwordMatch ? "#1D9E75" : "#A32D2D",
                  }}
                >
                  {passwordMatch
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#ccc" : "#E87722",
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
            {loading ? "Creating account..." : "Create free account"}
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

        <GoogleLoginButton redirectTo="/" />

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#888",
            marginTop: "20px",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#534AB7",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
