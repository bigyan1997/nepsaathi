import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Auto redirect after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
        background: "#F5F4F0",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "520px" }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <div style={{ position: "relative", width: "48px", height: "36px" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 2,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#E87722",
                opacity: 0.3,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: 2,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#534AB7",
                opacity: 0.3,
              }}
            />
          </div>
        </div>

        {/* 404 */}
        <div
          style={{
            fontSize: "120px",
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: "16px",
            background: "linear-gradient(135deg, #E87722, #534AB7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        {/* Nepali text */}
        <div
          style={{
            fontSize: "16px",
            color: "#534AB7",
            fontWeight: 500,
            marginBottom: "8px",
            letterSpacing: "0.05em",
          }}
        >
          पृष्ठ फेला परेन
        </div>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#26215C",
            marginBottom: "12px",
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#888",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}
        >
          The page you're looking for doesn't exist or has been moved. You'll be
          redirected to the homepage in{" "}
          <span style={{ color: "#E87722", fontWeight: 600 }}>{countdown}</span>{" "}
          seconds.
        </p>

        {/* Quick links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {[
            { to: "/jobs", emoji: "💼", label: "Browse jobs" },
            { to: "/rooms", emoji: "🏠", label: "Find rooms" },
            { to: "/events", emoji: "🎉", label: "See events" },
            { to: "/businesses", emoji: "🏪", label: "Businesses" },
          ].map(({ to, emoji, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "10px",
                padding: "12px 16px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#333",
                fontWeight: 500,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#AFA9EC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e5e5")
              }
            >
              <span style={{ fontSize: "18px" }}>{emoji}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Home button */}
        <Link
          to="/"
          style={{
            display: "inline-block",
            background: "#534AB7",
            color: "#fff",
            padding: "12px 32px",
            borderRadius: "9px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ← Back to NepSaathi
        </Link>
      </div>
    </div>
  );
}
