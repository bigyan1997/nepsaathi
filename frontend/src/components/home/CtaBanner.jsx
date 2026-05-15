import { Link } from "react-router-dom";

export default function CtaBanner({ isAuthenticated }) {
  return (
    <div className="home-section" style={{ padding: "0 28px 52px", maxWidth: "1000px", margin: "0 auto" }}>
      <div className="cta-inner" style={{
        background: "#26215C",
        borderRadius: "16px",
        padding: "40px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#AFA9EC", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 600 }}>
            FREE · ALWAYS
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "8px", letterSpacing: "-0.2px" }}>
            Have something to share?
          </h2>
          <p style={{ fontSize: "14px", color: "#AFA9EC", lineHeight: 1.6, maxWidth: "380px" }}>
            Post a job, room, event or notice — reach thousands of Nepalese Australians instantly.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {isAuthenticated ? (
            <Link to="/post-ad"
              style={{ background: "#E87722", color: "#fff", padding: "12px 28px", borderRadius: "9px", textDecoration: "none", fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap", transition: "background 0.15s ease", display: "inline-block" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d46a1a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#E87722")}>
              Post a free ad →
            </Link>
          ) : (
            <>
              <Link to="/register"
                style={{ background: "#E87722", color: "#fff", padding: "12px 28px", borderRadius: "9px", textDecoration: "none", fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap", transition: "background 0.15s ease", display: "inline-block" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d46a1a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#E87722")}>
                Join free →
              </Link>
              <Link to="/login"
                style={{ background: "rgba(255,255,255,0.06)", color: "#AFA9EC", padding: "12px 20px", borderRadius: "9px", textDecoration: "none", fontSize: "14px", border: "0.5px solid rgba(175,169,236,0.4)", whiteSpace: "nowrap", transition: "background 0.15s ease, color 0.15s ease", display: "inline-block" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#AFA9EC"; }}>
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
