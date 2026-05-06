import { Link } from "react-router-dom";
import { HOME_CATEGORIES } from "./homeUtils";

export default function CategoryCards() {
  return (
    <div className="home-section" style={{ padding: "36px 28px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        {HOME_CATEGORIES.map(({ to, emoji, label, desc, color, border }) => (
          <Link
            key={to}
            to={to}
            style={{
              background: color,
              border: `0.5px solid ${border}`,
              borderRadius: "12px",
              padding: "18px 16px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span style={{ fontSize: "24px" }}>{emoji}</span>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C" }}>{label}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
