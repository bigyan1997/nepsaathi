import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logout as logoutApi } from "../../api/auth";

const NAV_LINKS = [
  { to: "/jobs", label: "Jobs" },
  { to: "/rooms", label: "Rooms" },
  { to: "/events", label: "Events" },
  { to: "/announcements", label: "Announcements" },
  { to: "/businesses", label: "Businesses" },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("nepsaathi_refresh_token");
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (e) {
      // Even if API call fails, clear local state
    } finally {
      logout();
      navigate("/");
      setDropdownOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "0.5px solid #e5e5e5",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", width: "32px", height: "24px" }}>
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
                background: "#534AB7",
                opacity: 0.88,
              }}
            />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 600 }}>
            <span style={{ color: "#E87722" }}>Nep</span>
            <span style={{ color: "#26215C" }}>Saathi</span>
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#aaa",
              letterSpacing: "0.03em",
              display: "none",
            }}
            className="deva"
          >
            नेपसाथी
          </span>
        </Link>

        {/* Desktop nav links */}
        <div
          style={{ display: "flex", gap: "4px", alignItems: "center" }}
          className="desktop-nav"
        >
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: "13px",
                color: isActive(to) ? "#534AB7" : "#555",
                textDecoration: "none",
                fontWeight: isActive(to) ? 600 : 400,
                padding: "6px 12px",
                borderRadius: "7px",
                background: isActive(to) ? "#EEEDFE" : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive(to)) e.currentTarget.style.background = "#F5F4F0";
              }}
              onMouseLeave={(e) => {
                if (!isActive(to))
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
          className="desktop-nav"
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/post-ad"
                style={{
                  background: "#E87722",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                + Post free ad
              </Link>

              {/* User dropdown */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: dropdownOpen ? "#EEEDFE" : "#F5F4F0",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "8px",
                    padding: "7px 12px",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "#26215C",
                    fontWeight: 500,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#534AB7",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {user?.google_avatar ? (
                      <img
                        src={user.google_avatar}
                        alt={user.first_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      user?.first_name?.[0]?.toUpperCase()
                    )}
                  </div>
                  {user?.first_name}
                  <span style={{ fontSize: "10px", color: "#888" }}>▼</span>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#fff",
                      border: "0.5px solid #e5e5e5",
                      borderRadius: "12px",
                      padding: "6px",
                      minWidth: "200px",
                      zIndex: 200,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* User info */}
                    <div
                      style={{
                        padding: "10px 12px 10px",
                        borderBottom: "0.5px solid #f0f0f0",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#26215C",
                        }}
                      >
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "2px",
                        }}
                      >
                        {user?.email}
                      </div>
                    </div>

                    {[
                      { to: "/my-listings", label: "My listings", emoji: "📋" },
                      {
                        to: "/register-business",
                        label: "Register business",
                        emoji: "🏪",
                      },
                      {
                        to: "/profile",
                        label: "Profile settings",
                        emoji: "⚙️",
                      },
                    ].map(({ to, label, emoji }) => (
                      <Link
                        key={to}
                        to={to}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "#333",
                          textDecoration: "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F5F4F0")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <span style={{ fontSize: "14px" }}>{emoji}</span>
                        {label}
                      </Link>
                    ))}

                    <div
                      style={{
                        borderTop: "0.5px solid #f0f0f0",
                        marginTop: "4px",
                        paddingTop: "4px",
                      }}
                    >
                      <button
                        onClick={handleLogout}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "#A32D2D",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FCEBEB")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <span style={{ fontSize: "14px" }}>🚪</span>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontSize: "13px",
                  color: "#555",
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  background: "#E87722",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Join free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-menu-btn"
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "7px",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div
            style={{
              width: "22px",
              height: "2px",
              background: menuOpen ? "#534AB7" : "#555",
              borderRadius: "2px",
              transition: "all 0.2s",
              transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none",
            }}
          />
          <div
            style={{
              width: "22px",
              height: "2px",
              background: menuOpen ? "transparent" : "#555",
              borderRadius: "2px",
              transition: "all 0.2s",
            }}
          />
          <div
            style={{
              width: "22px",
              height: "2px",
              background: menuOpen ? "#534AB7" : "#555",
              borderRadius: "2px",
              transition: "all 0.2s",
              transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "#fff",
            borderBottom: "0.5px solid #e5e5e5",
            padding: "12px 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            position: "sticky",
            top: "56px",
            zIndex: 99,
          }}
          className="mobile-menu"
        >
          {/* Nav links */}
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: "14px",
                color: isActive(to) ? "#534AB7" : "#333",
                textDecoration: "none",
                fontWeight: isActive(to) ? 600 : 400,
                padding: "10px 12px",
                borderRadius: "8px",
                background: isActive(to) ? "#EEEDFE" : "transparent",
              }}
            >
              {label}
            </Link>
          ))}

          <div style={{ borderTop: "0.5px solid #f0f0f0", margin: "8px 0" }} />

          {isAuthenticated ? (
            <>
              {/* User info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "#F5F4F0",
                  borderRadius: "8px",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#534AB7",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {user?.google_avatar ? (
                    <img
                      src={user.google_avatar}
                      alt={user.first_name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    user?.first_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#26215C",
                    }}
                  >
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888" }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              {[
                {
                  to: "/post-ad",
                  label: "Post free ad",
                  emoji: "📢",
                  highlight: true,
                },
                { to: "/my-listings", label: "My listings", emoji: "📋" },
                {
                  to: "/register-business",
                  label: "Register business",
                  emoji: "🏪",
                },
                { to: "/profile", label: "Profile settings", emoji: "⚙️" },
              ].map(({ to, label, emoji, highlight }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: highlight
                      ? "#E87722"
                      : isActive(to)
                        ? "#534AB7"
                        : "#333",
                    textDecoration: "none",
                    fontWeight: highlight || isActive(to) ? 600 : 400,
                    background: highlight
                      ? "#FFF1E0"
                      : isActive(to)
                        ? "#EEEDFE"
                        : "transparent",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{emoji}</span>
                  {label}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#A32D2D",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "16px" }}>🚪</span>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#333",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "11px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#fff",
                  textDecoration: "none",
                  background: "#E87722",
                  fontWeight: 500,
                  marginTop: "4px",
                }}
              >
                Join free — post your first ad
              </Link>
            </>
          )}
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  );
}
