import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import usePageTitle from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Page Not Found");
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

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
  }, [navigate]);

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
      <div style={{ textAlign: "center", maxWidth: "520px", width: "100%" }}>
        {/* Dark card */}
        <div
          style={{
            background: "#26215C",
            borderRadius: "20px",
            padding: "48px 32px",
            marginBottom: "14px",
          }}
        >
          {/* Big 404 */}
          <div
            style={{
              fontSize: "96px",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "8px",
              color: "#AFA9EC",
              letterSpacing: "-4px",
            }}
          >
            404
          </div>

          {/* Nepali text */}
          <div
            style={{
              fontSize: "15px",
              color: "#534AB7",
              fontWeight: 500,
              marginBottom: "12px",
              letterSpacing: "0.05em",
            }}
          >
            पृष्ठ फेला परेन
          </div>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "10px",
            }}
          >
            Page not found
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#AFA9EC",
              lineHeight: 1.7,
              marginBottom: "28px",
            }}
          >
            The page you're looking for doesn't exist or has been moved.
            Redirecting in{" "}
            <span style={{ color: "#E87722", fontWeight: 700 }}>
              {countdown}
            </span>
            s…
          </p>

          {/* Home button */}
          <Link
            to="/"
            style={{
              display: "inline-block",
              background: "#E87722",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            ← Back to NepSaathi
          </Link>
        </div>

        {/* Quick links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          {[
            {
              to: "/jobs",
              emoji: "💼",
              label: "Browse jobs",
              bg: "#EEEDFE",
              border: "#AFA9EC",
              color: "#3C3489",
            },
            {
              to: "/rooms",
              emoji: "🏠",
              label: "Find rooms",
              bg: "#FFF1E0",
              border: "#EFD9C0",
              color: "#633806",
            },
            {
              to: "/events",
              emoji: "🎉",
              label: "See events",
              bg: "#E1F5EE",
              border: "#9FE1CB",
              color: "#085041",
            },
            {
              to: "/businesses",
              emoji: "🏪",
              label: "Businesses",
              bg: "#FAEEDA",
              border: "#FAC775",
              color: "#633806",
            },
          ].map(({ to, emoji, label, bg, border, color }) => (
            <Link
              key={to}
              to={to}
              style={{
                background: bg,
                border: `0.5px solid ${border}`,
                borderRadius: "12px",
                padding: "14px 16px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <span style={{ fontSize: "20px" }}>{emoji}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color }}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
