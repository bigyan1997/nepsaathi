import { Link } from "react-router-dom";

export default function CtaBanner({ isAuthenticated }) {
  return (
    <div className="home-section" style={{ padding: "0 28px 48px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        className="cta-inner"
        style={{
          background: "#26215C",
          borderRadius: "16px",
          padding: "36px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#AFA9EC",
              letterSpacing: "0.08em",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            FREE · ALWAYS
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>
            Have something to share?
          </h2>
          <p style={{ fontSize: "14px", color: "#AFA9EC", lineHeight: 1.6 }}>
            Post a job, room, event or notice — reach thousands of Nepalese Australians instantly.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {isAuthenticated ? (
            <Link
              to="/post-ad"
              style={{
                background: "#E87722",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: "9px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Post a free ad →
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                style={{
                  background: "#E87722",
                  color: "#fff",
                  padding: "12px 28px",
                  borderRadius: "9px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Join free →
              </Link>
              <Link
                to="/login"
                style={{
                  background: "transparent",
                  color: "#AFA9EC",
                  padding: "12px 20px",
                  borderRadius: "9px",
                  textDecoration: "none",
                  fontSize: "14px",
                  border: "0.5px solid #534AB7",
                  whiteSpace: "nowrap",
                }}
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
