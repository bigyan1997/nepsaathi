import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "#26215C",
        color: "#fff",
        marginTop: "48px",
      }}
    >
      {/* Main footer content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "48px 28px 36px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "40px",
        }}
      >
        {/* Brand column */}
        <div>
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              marginBottom: "16px",
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
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#E87722",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "10px",
                  top: 1,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#AFA9EC",
                  opacity: 0.9,
                }}
              />
            </div>
            <span style={{ fontSize: "17px", fontWeight: 600 }}>
              <span style={{ color: "#E87722" }}>Nep</span>
              <span style={{ color: "#fff" }}>Saathi</span>
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#AFA9EC",
                letterSpacing: "0.03em",
              }}
            >
              नेपसाथी
            </span>
          </Link>

          <p
            style={{
              fontSize: "13px",
              color: "#AFA9EC",
              lineHeight: 1.7,
              marginBottom: "20px",
              maxWidth: "260px",
            }}
          >
            Your trusted Nepali friend, wherever you are. Connecting the
            Nepalese diaspora across Australia.
          </p>

          {/* Social links */}
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "Facebook", href: "https://facebook.com", emoji: "📘" },
              {
                label: "Instagram",
                href: "https://instagram.com",
                emoji: "📸",
              },
              { label: "WhatsApp", href: "https://whatsapp.com", emoji: "💬" },
            ].map(({ label, href, emoji }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                title={label}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                }
              >
                {emoji}
              </a>
            ))}
          </div>
        </div>

        {/* Browse column */}
        <div>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "16px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Browse
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[
              { to: "/jobs", label: "Jobs" },
              { to: "/rooms", label: "Rooms" },
              { to: "/events", label: "Events" },
              { to: "/announcements", label: "Announcements" },
              { to: "/businesses", label: "Businesses" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: "13px",
                  color: "#AFA9EC",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#AFA9EC")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Account column */}
        <div>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "16px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Account
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[
              { to: "/register", label: "Join free" },
              { to: "/login", label: "Sign in" },
              { to: "/post-ad", label: "Post a free ad" },
              { to: "/register-business", label: "Register business" },
              { to: "/my-listings", label: "My listings" },
              { to: "/profile", label: "Profile settings" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: "13px",
                  color: "#AFA9EC",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#AFA9EC")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact column */}
        <div>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "16px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Contact
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <a
              href="mailto:hello@nepsaathi.com"
              style={{
                fontSize: "13px",
                color: "#AFA9EC",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#AFA9EC")}
            >
              hello@nepsaathi.com
            </a>

            <a
              href="mailto:support@nepsaathi.com"
              style={{
                fontSize: "13px",
                color: "#AFA9EC",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#AFA9EC")}
            >
              support@nepsaathi.com
            </a>

            {/* Australia badge */}
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#AFA9EC",
              }}
            >
              🇦🇺 Based in Australia
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#AFA9EC",
              }}
            >
              🇳🇵 Built for Nepalese diaspora
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }} />

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "18px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "12px", color: "#AFA9EC" }}>
          © {currentYear} NepSaathi. All rights reserved. · नेपसाथी
        </span>
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Use" },
            { to: "/contact", label: "Contact" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: "12px",
                color: "#AFA9EC",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#AFA9EC")}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
