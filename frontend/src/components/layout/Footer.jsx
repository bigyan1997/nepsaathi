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
        className="footer-grid"
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
            {/* Facebook */}

            <a
              href="https://facebook.com/nepsaathi"
              target="_blank"
              rel="noreferrer"
              title="Facebook"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1877F2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* Instagram */}

            <a
              href="https://instagram.com/nepsaathi"
              target="_blank"
              rel="noreferrer"
              title="Instagram"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E1306C")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>

            {/* WhatsApp */}

            <a
              href="https://wa.me/your-whatsapp-number"
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#25D366")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
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
        className="footer-bottom"
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
      <style>
        {`
            @media (max-width: 768px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 24px !important;
                padding: 32px 16px 24px !important;
            }
            }
            @media (max-width: 480px) {
            .footer-grid {
                grid-template-columns: 1fr !important;
                padding: 28px 16px 20px !important;
            }
            .footer-bottom {
                padding: 16px !important;
                flex-direction: column !important;
                align-items: flex-start !important;
            }
            }
        `}
      </style>
    </footer>
  );
}
