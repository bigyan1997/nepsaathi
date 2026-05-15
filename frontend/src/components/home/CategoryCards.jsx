import { Link } from "react-router-dom";
import { HOME_CATEGORIES } from "./homeUtils";

export default function CategoryCards() {
  return (
    <div className="home-section" style={{ padding: "32px 28px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <style>{`
        .cat-card { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease !important; }
        .cat-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {HOME_CATEGORIES.map(({ to, emoji, label, desc, color, border }) => (
          <Link key={to} to={to} className="cat-card"
            style={{
              background: color,
              border: `0.5px solid ${border}`,
              borderRadius: "12px",
              padding: "18px 16px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}>
            <span style={{ fontSize: "24px" }}>{emoji}</span>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", letterSpacing: "-0.01em" }}>{label}</div>
            <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.4 }}>{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
