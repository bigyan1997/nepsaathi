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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
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

  const fields = [
    {
      key: "firstName",
      label: "First name",
      type: "text",
      placeholder: "John",
    },
    { key: "lastName", label: "Last name", type: "text", placeholder: "Doe" },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "you@example.com",
    },
    {
      key: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
    },
    {
      key: "confirmPassword",
      label: "Confirm password",
      type: "password",
      placeholder: "••••••••",
    },
  ];

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
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#444",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                {label}
              </label>
              <input
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
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
          ))}
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
