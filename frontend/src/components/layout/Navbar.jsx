import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav
      style={{
        background: "#ffffff",
        borderBottom: "0.5px solid #e5e5e5",
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
        }}
      >
        <div style={{ position: "relative", width: "36px", height: "26px" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 2,
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#E87722",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "11px",
              top: 2,
              width: "22px",
              height: "22px",
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
        <span
          style={{ fontSize: "11px", color: "#888", letterSpacing: "0.03em" }}
        >
          नेपसाथी
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "22px" }}>
        {[
          { to: "/jobs", label: "Jobs" },
          { to: "/rooms", label: "Rooms" },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              fontSize: "13px",
              color: "#555",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {isAuthenticated ? (
          <>
            <span style={{ fontSize: "13px", color: "#555" }}>
              Hi, {user?.first_name}
            </span>
            <Link
              to="/post-ad"
              style={{
                background: "#E87722",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              + Post free ad
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "0.5px solid #ccc",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                cursor: "pointer",
                color: "#555",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                fontSize: "13px",
                color: "#555",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              style={{
                background: "#E87722",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              + Post free ad
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
