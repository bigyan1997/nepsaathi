import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { register } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import usePageTitle from "../../hooks/usePageTitle";
import NepSaathiLogo from "../../components/ui/NepSaathiLogo";

export default function RegisterPage() {
  usePageTitle("Create Account");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

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
      const data = await register({ ...form, refCode });
      if (data.access) {
        setAuth(data.user, data.access, data.refresh);
        navigate("/");
      } else {
        // Email verification required — backend returned {"detail": "Verification e-mail sent."}
        setVerificationEmail(form.email);
        setVerificationSent(true);
      }
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

  if (verificationSent) {
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
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#26215C", marginBottom: "8px" }}>
            Check your email
          </h1>
          <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, marginBottom: "24px" }}>
            We sent a verification link to{" "}
            <strong style={{ color: "#26215C" }}>{verificationEmail}</strong>.
            <br />
            Click the link to activate your account.
          </p>
          <div
            style={{
              background: "#EEEDFE",
              border: "0.5px solid #AFA9EC",
              borderRadius: "10px",
              padding: "14px 16px",
              fontSize: "13px",
              color: "#3C3489",
              marginBottom: "24px",
              lineHeight: 1.6,
            }}
          >
            Didn't get it? Check your spam folder or{" "}
            <Link to="/register" style={{ color: "#534AB7", fontWeight: 600 }}>
              try again
            </Link>
            .
          </div>
          <Link
            to="/login"
            style={{
              fontSize: "13px",
              color: "#888",
              textDecoration: "none",
            }}
          >
            Already verified? Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "linear-gradient(150deg, #edeaf8 0%, #f8f7ff 45%, #fff6ef 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative brand blobs */}
      <div style={{ position: "absolute", top: "-120px", left: "-120px", width: "480px", height: "480px", borderRadius: "50%", background: "rgba(83,74,183,0.22)", filter: "blur(90px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-100px", right: "-100px", width: "420px", height: "420px", borderRadius: "50%", background: "rgba(232,119,34,0.18)", filter: "blur(90px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "35%", right: "5%", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(83,74,183,0.12)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "25%", left: "4%", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(232,119,34,0.12)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px 24px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 4px 32px rgba(83,74,183,0.08)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <NepSaathiLogo size={22} animated />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#26215C" }}>
            Create account
          </h1>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            Join the NepSaathi community — it's free
          </p>
        </div>

        {/* Referral banner */}
        {refCode && (
          <div style={{ background: "#E1F5EE", border: "0.5px solid #6EE7B7", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#085041", marginBottom: "14px", textAlign: "center" }}>
            🤝 You were invited! Sign up to help your friend earn points.
          </div>
        )}

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
