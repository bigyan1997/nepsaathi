import { useState } from "react";
import { Link } from "react-router-dom";
import { StarIcon } from "@phosphor-icons/react";
import { CARD_ACCENT } from "./homeUtils";

export default function DesktopCard({
  to,
  accentType,
  emoji,
  timeStr,
  title,
  subtitle,
  description,
  stats,
  isFeatured,
}) {
  const accent = CARD_ACCENT[accentType] || CARD_ACCENT.default;
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: isFeatured ? "1.5px solid #E87722" : "0.5px solid #e5e5e5",
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.13)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.2s, transform 0.2s",
        minHeight: "320px",
      }}
    >
      <div
        style={{
          background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.45) 0%, ${accent.bg} 65%)`,
          height: "110px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {emoji && <span style={{ fontSize: "48px" }}>{emoji}</span>}
        {isFeatured && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "linear-gradient(135deg, #E87722, #534AB7)",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "6px",
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <StarIcon size={9} weight="fill" color="#fff" />FEATURED
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: accent.footer,
            opacity: 0.35,
          }}
        />
      </div>

      <div
        style={{
          padding: "16px 18px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {timeStr && (
          <div style={{ fontSize: "12px", fontWeight: 600, color: accent.time }}>
            {timeStr}
          </div>
        )}
        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: "12px", color: "#888", marginTop: "1px", display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap" }}>
            {subtitle}
          </div>
        )}
        {description && (
          <div
            style={{
              fontSize: "13px",
              color: "#555",
              lineHeight: 1.55,
              marginTop: "4px",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          background: accent.footer,
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {stats.map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "10px", opacity: 0.82, marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}
