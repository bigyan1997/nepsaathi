import { useState } from "react";
import { Link } from "react-router-dom";
import NepSaathiLogo from "../ui/NepSaathiLogo";
import useT from "../../hooks/useT";
import api from "../../utils/axios";

const ICON_EXPLORE = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const ICON_GUIDES = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const ICON_ACCOUNT = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const ICON_ABOUT = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const ICON_SHIELD = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function ColHeader({ icon, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        marginBottom: "16px",
      }}
    >
      <span style={{ color: "#A09AE0" }}>{icon}</span>
      <h3
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {label}
      </h3>
    </div>
  );
}

function FooterLink({ to, children, external }) {
  const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#C9C4F5",
    textDecoration: "none",
    padding: "4px 0",
    transition: "color 0.15s",
  };
  const chevron = <span style={{ fontSize: "11px", opacity: 0.5 }}>›</span>;

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        style={style}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#C9C4F5")}
      >
        {children}
        {chevron}
      </a>
    );
  }
  return (
    <Link
      to={to}
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#C9C4F5")}
    >
      {children}
      {chevron}
    </Link>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useT();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || subscribed) return;
    setSubLoading(true);
    try {
      const res = await api.post("/api/newsletter/subscribe/", { email });
      if (res.status === 200) {
        setAlreadySubscribed(true);
      } else {
        setSubscribed(true);
      }
    } catch (_) {
      setSubscribed(true);
    }
    setSubLoading(false);
    setEmail("");
  };

  return (
    <footer>
      {/* ── Newsletter strip ── */}
      <div style={{ background: "#f8f7ff", borderTop: "1px solid #ece9fc" }}>
        <div
          className="footer-newsletter"
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "28px 28px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Icon + Text grouped so they never split on mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "220px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#EEEDFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#534AB7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#26215C",
                marginBottom: "3px",
              }}
            >
              Stay Updated with{" "}
              <span style={{ color: "#534AB7" }}>NepSaathi</span>
            </div>
            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
              Get the latest jobs, events and community resources delivered to
              your inbox.
            </div>
          </div>
          </div>
          {/* Form */}
          {subscribed ? (
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#1B8F5E",
                background: "#E1F5EE",
                borderRadius: "9px",
                padding: "11px 20px",
              }}
            >
              ✓ You're subscribed!
            </div>
          ) : alreadySubscribed ? (
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#7C6F2E",
                background: "#FFF8DC",
                borderRadius: "9px",
                padding: "11px 20px",
              }}
            >
              You've already subscribed
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              style={{
                display: "flex",
                gap: "8px",
                flexShrink: 0,
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#aaa",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  style={{
                    paddingLeft: "36px",
                    paddingRight: "14px",
                    paddingTop: "11px",
                    paddingBottom: "11px",
                    border: "1.5px solid #ddd",
                    borderRadius: "9px",
                    fontSize: "13px",
                    width: "230px",
                    fontFamily: "inherit",
                    outline: "none",
                    background: "#fff",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={subLoading}
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "11px 22px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  opacity: subLoading ? 0.7 : 1,
                }}
              >
                {subLoading ? "…" : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Main footer ── */}
      <div style={{ background: "#26215C", color: "#fff" }}>
        <div
          className="footer-grid"
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "44px 28px 36px",
            display: "grid",
            gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1fr",
            gap: "36px",
          }}
        >
          {/* Brand */}
          <div>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "14px",
              }}
            >
              <NepSaathiLogo size={24} dark />
            </Link>
            <p
              style={{
                fontSize: "12px",
                color: "rgba(201,196,245,0.7)",
                marginBottom: "4px",
                letterSpacing: "0.02em",
              }}
            >
              Together for the Nepalese community
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#C9C4F5",
                lineHeight: 1.7,
                marginBottom: "20px",
                maxWidth: "230px",
              }}
            >
              {t("footer.tagline")}
            </p>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(201,196,245,0.55)",
                marginBottom: "20px",
              }}
            >
              🇦🇺 Based in Australia · 🇳🇵 Built for Nepalese
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(201,196,245,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "12px",
              }}
            >
              Follow Us
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                {
                  href: "https://www.facebook.com/nepsaathi/",
                  title: "Facebook",
                  hover: "#1877F2",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
                {
                  href: "https://www.instagram.com/nepsaathi/",
                  title: "Instagram",
                  hover: "#E1306C",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  ),
                },
                {
                  href: "https://wa.me/your-whatsapp-number",
                  title: "WhatsApp",
                  hover: "#25D366",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  ),
                },
              ].map(({ href, title, hover, icon }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  style={{
                    width: "34px",
                    height: "34px",
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
                    (e.currentTarget.style.background = hover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                >
                  {icon}
                </a>
              ))}
            </div>

            {/* Preferred Source button — rendered by Google's publisher.js */}
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "rgba(201,196,245,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: "10px",
                }}
              >
                Google Preferred Source
              </div>
              <div google-add-preferred-source-btn data-theme="dark" />
            </div>
          </div>

          {/* Explore */}
          <div>
            <ColHeader icon={ICON_EXPLORE} label="Explore" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { to: "/jobs", label: t("footer.jobs") },
                { to: "/rooms", label: t("footer.rooms") },
                { to: "/events", label: t("footer.events") },
                { to: "/businesses", label: t("footer.businesses") },
                { to: "/forum", label: t("footer.forum") },
              ].map(({ to, label }) => (
                <FooterLink key={to} to={to}>
                  {label}
                </FooterLink>
              ))}
            </div>
          </div>

          {/* Guides & Tools */}
          <div>
            <ColHeader icon={ICON_GUIDES} label="Guides" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { to: "/send-money", label: t("footer.sendMoney") },
                { to: "/visa", label: t("footer.visaHub") },
                { to: "/new-to-australia", label: t("footer.newToAustralia") },
                { to: "/whatsapp-groups", label: t("footer.whatsappGroups") },
                { to: "/guides/banking", label: "Settlement Guides" },
              ].map(({ to, label }) => (
                <FooterLink key={to} to={to}>
                  {label}
                </FooterLink>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <ColHeader icon={ICON_ACCOUNT} label={t("footer.account")} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { to: "/register", label: t("footer.joinFree") },
                { to: "/login", label: t("footer.signIn") },
                { to: "/post-ad", label: t("footer.postAd") },
                {
                  to: "/register-business",
                  label: t("footer.registerBusiness"),
                },
                { to: "/my-listings", label: t("footer.myListings") },
                { to: "/profile", label: t("footer.profileSettings") },
              ].map(({ to, label }) => (
                <FooterLink key={to} to={to}>
                  {label}
                </FooterLink>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <ColHeader icon={ICON_ABOUT} label="About" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { to: "/contact", label: "Contact Us" },
                { to: "/contact", label: "Help & Support" },
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Use" },
              ].map(({ to, label }) => (
                <FooterLink key={label} to={to}>
                  {label}
                </FooterLink>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }} />

        {/* ── Bottom bar 1 — legal ── */}
        <div
          className="footer-legal"
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "rgba(201,196,245,0.6)",
            }}
          >
            <span style={{ color: "rgba(201,196,245,0.5)" }}>
              {ICON_SHIELD}
            </span>
            <span>NepSaathi · hello@nepsaathi.com · support@nepsaathi.com</span>
          </div>
          <div style={{ display: "flex", gap: "0" }}>
            {[
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/terms", label: "Terms of Use" },
              { to: "/contact", label: "Contact" },
            ].map(({ to, label }, i) => (
              <span key={to} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.15)",
                      padding: "0 10px",
                    }}
                  >
                    |
                  </span>
                )}
                <Link
                  to={to}
                  style={{
                    fontSize: "12px",
                    color: "rgba(201,196,245,0.6)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(201,196,245,0.6)")
                  }
                >
                  {label}
                </Link>
              </span>
            ))}
          </div>
        </div>

        {/* ── Bottom bar 2 — copyright ── */}
        <div
          style={{
            background: "rgba(0,0,0,0.15)",
            borderTop: "0.5px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="footer-copy"
            style={{
              maxWidth: "1000px",
              margin: "0 auto",
              padding: "13px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "12px", color: "rgba(201,196,245,0.5)" }}>
              🇦🇺 🇳🇵 Proudly supporting the Nepalese community in Australia
            </span>
            <span style={{ fontSize: "12px", color: "rgba(201,196,245,0.4)" }}>
              © {currentYear} NepSaathi. All rights reserved. · नेपसाथी
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 28px !important;
            padding: 36px 20px 28px !important;
          }
          .footer-grid > div:first-child { grid-column: 1 / -1; }
          .footer-newsletter { padding: 20px 20px !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; padding: 28px 16px 24px !important; }
          .footer-legal { padding: 14px 16px !important; flex-direction: column !important; align-items: flex-start !important; }
          .footer-copy { padding: 12px 16px !important; flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
          .footer-newsletter { flex-direction: column !important; align-items: flex-start !important; }
          .footer-newsletter input { width: 100% !important; box-sizing: border-box; }
        }
      `}</style>
    </footer>
  );
}
