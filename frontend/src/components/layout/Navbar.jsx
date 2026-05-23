import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import { logout as logoutApi } from "../../api/auth";
import { getUnreadCount } from "../../api/messages";
import { useToast } from "../ui/Toast";
import NepSaathiLogo from "../ui/NepSaathiLogo";

const NAV_LINKS = [
  { to: "/jobs",       label: "Jobs",       activeColor: "#534AB7", activeBg: "#EEEDFE" },
  { to: "/rooms",      label: "Rooms",      activeColor: "#85510A", activeBg: "#FFF1E0" },
  { to: "/events",     label: "Events",     activeColor: "#1D9E75", activeBg: "#E1F5EE" },
  { to: "/notices",    label: "Notices",    activeColor: "#0C447C", activeBg: "#E6F1FB" },
  { to: "/businesses", label: "Businesses", activeColor: "#633806", activeBg: "#FAEEDA" },
  { to: "/forum",      label: "Forum",      activeColor: "#26215C", activeBg: "#EEEDFE" },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const prevUnreadRef = useRef(null);
  const { addToast } = useToast();

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const unreadCount = unreadData?.unread_count || 0;

  // Show toast when new messages arrive while not on the inbox/conversation pages
  useEffect(() => {
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount;
      return;
    }
    const isOnMessagesPage =
      location.pathname.startsWith("/messages") ||
      location.pathname.startsWith("/inbox");
    if (unreadCount > prevUnreadRef.current && !isOnMessagesPage) {
      addToast(
        <span>
          💬 You have a new message —{" "}
          <a
            href="/messages"
            style={{ color: "#26215C", fontWeight: 700, textDecoration: "underline" }}
          >
            View inbox
          </a>
        </span>,
        "info",
        6000,
      );
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

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
      console.error("Logout API failed, continuing with local cleanup");
    } finally {
      // 1. Perform the logout (clears state, localStorage, and persist-key)
      logout();

      // 2. Force a hard navigation to /login to ensure the UI
      // re-initializes from a clean state without stale objects
      window.location.href = "/login";
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

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
            textDecoration: "none",
            flexShrink: 0,
            transition: "transform 0.18s ease, opacity 0.18s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <NepSaathiLogo size={24} animated />
        </Link>

        {/* Desktop nav links */}
        <div
          style={{ display: "flex", gap: "4px", alignItems: "center" }}
          className="desktop-nav"
        >
          {NAV_LINKS.map(({ to, label, activeColor, activeBg }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: "13px",
                color: isActive(to) ? activeColor : "#555",
                textDecoration: "none",
                fontWeight: isActive(to) ? 600 : 400,
                padding: "6px 12px",
                borderRadius: "7px",
                background: isActive(to) ? activeBg : "transparent",
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
              {/* Messages icon */}
              <Link
                to="/messages"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: isActive("/messages") ? "#EEEDFE" : "transparent",
                  color: isActive("/messages") ? "#534AB7" : "#555",
                  textDecoration: "none",
                  fontSize: "18px",
                }}
                title="Messages"
              >
                💬
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "#E87722",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

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
                      { to: "/messages", label: "Messages", emoji: "💬", badge: unreadCount },
                      { to: "/saved-searches", label: "Search alerts", emoji: "🔔" },
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
                    ].map(({ to, label, emoji, badge }) => (
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
                        {badge > 0 && (
                          <span style={{
                            marginLeft: "auto",
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            background: "#E87722",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px",
                          }}>
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
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
          aria-label={menuOpen ? "Close menu" : "Open menu"}
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
          {NAV_LINKS.map(({ to, label, activeColor, activeBg }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: "14px",
                color: isActive(to) ? activeColor : "#333",
                textDecoration: "none",
                fontWeight: isActive(to) ? 600 : 400,
                padding: "10px 12px",
                borderRadius: "8px",
                background: isActive(to) ? activeBg : "transparent",
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
                { to: "/messages", label: "Messages", emoji: "💬", badge: unreadCount },
                { to: "/saved-searches", label: "Search alerts", emoji: "🔔" },
                {
                  to: "/register-business",
                  label: "Register business",
                  emoji: "🏪",
                },
                { to: "/profile", label: "Profile settings", emoji: "⚙️" },
              ].map(({ to, label, emoji, highlight, badge }) => (
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
                  {badge > 0 && (
                    <span style={{
                      marginLeft: "auto",
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      background: "#E87722",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
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
