import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { timeAgo } from "./homeUtils";
import { MapPinIcon, PushPinIcon } from "@phosphor-icons/react";

const TYPE_META = {
  job:    { emoji: "💼", bg: "#EEEDFE", color: "#3C3489", path: "jobs" },
  room:   { emoji: "🏠", bg: "#FFF1E0", color: "#633806", path: "rooms" },
  event:  { emoji: "🎉", bg: "#E1F5EE", color: "#085041", path: "events" },
  notice: { emoji: "📢", bg: "#E6F1FB", color: "#0C447C", path: "notices" },
};

function NewDesktopCard({ to, emoji, typeBg, typeColor, typeLabel, timeStr, title, subtitle, description, scrollCard }) {
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
        border: `1.5px solid ${hovered ? "#16a34a" : "#bbf7d0"}`,
        boxShadow: hovered ? "0 8px 28px rgba(22,163,74,0.15)" : "0 2px 8px rgba(22,163,74,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
        minHeight: "300px",
        ...(scrollCard && { width: "260px", flexShrink: 0, scrollSnapAlign: "start" }),
      }}
    >
      {/* Top image strip */}
      <div style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.45) 0%, ${typeBg} 65%)`, height: "110px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        {emoji && <span style={{ fontSize: "48px" }}>{emoji}</span>}
        <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(22,163,74,0.92)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#bbf7d0", display: "inline-block", flexShrink: 0 }} />
          NEW
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px", background: typeBg, color: typeColor, fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px" }}>
          {typeLabel}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "#16a34a", opacity: 0.4 }} />
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        {timeStr && <div style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a" }}>{timeStr}</div>}
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#26215C", lineHeight: 1.25 }}>{title}</div>
        {subtitle && <div style={{ fontSize: "12px", color: "#888", marginTop: "1px", display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap" }}>{subtitle}</div>}
        {description && (
          <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.55, marginTop: "4px", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {description}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: "linear-gradient(135deg, #15803d, #16a34a)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ color: "#fff", fontSize: "11px", fontWeight: 600, opacity: 0.9 }}>Posted today</span>
        <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>View →</span>
      </div>
    </Link>
  );
}

export default function NewListingsCarousel({ listings }) {
  useEffect(() => {
    if (document.getElementById("ns-ping-style")) return;
    const s = document.createElement("style");
    s.id = "ns-ping-style";
    s.textContent = `@keyframes ns-ping { 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(2.2);opacity:0} }`;
    document.head.appendChild(s);
  }, []);

  const scrollRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const CARD_W = 264;

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * CARD_W * 3, behavior: "smooth" });
  };

  return (
    <div className="home-section" style={{ padding: "24px 0 32px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Pulsing live dot */}
          <span style={{ position: "relative", display: "inline-flex", width: "10px", height: "10px", flexShrink: 0 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#16a34a", opacity: 0.35, animation: "ns-ping 1.6s ease-in-out infinite" }} />
            <span style={{ position: "relative", width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
          </span>
          <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#1a1833", margin: 0, letterSpacing: "-0.01em" }}>New today</h2>
          <span style={{ background: "#16a34a", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", letterSpacing: "0.02em" }}>
            {listings.length}
          </span>
        </div>
        <div className="feat-arrows" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {[{ dir: -1, can: canLeft, ch: "‹" }, { dir: 1, can: canRight, ch: "›" }].map(({ dir, can, ch }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              disabled={!can}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: `1.5px solid ${can ? "#86efac" : "#e5e5e5"}`,
                background: can ? "#dcfce7" : "#F5F4F0",
                color: can ? "#15803d" : "#ccc",
                fontSize: "16px",
                cursor: can ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="feat-scroll"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "14px",
          padding: "4px 28px 12px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {listings.map((listing) => {
          const meta = TYPE_META[listing.listing_type] || { emoji: "📌", bg: "#F5F4F0", color: "#444", path: "jobs" };
          return (
            <NewDesktopCard
              key={listing.id}
              to={`/${meta.path}/${listing.slug}`}
              emoji={meta.emoji}
              typeBg={meta.bg}
              typeColor={meta.color}
              typeLabel={listing.listing_type?.toUpperCase()}
              timeStr={timeAgo(listing.created_at)}
              title={listing.title}
              subtitle={<span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={11} weight="fill" color="#E87722" style={{ flexShrink: 0 }} />{listing.location}, {listing.state}</span>}
              description={listing.description}
              scrollCard
            />
          );
        })}
      </div>

      {/* Progress bar + view all */}
      <div style={{ padding: "0 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "100%", height: "3px", background: "#e5e5e5", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: "30%",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #15803d, #16a34a)",
              transform: `translateX(${scrollPct * 233}%)`,
              transition: "transform 0.15s",
            }}
          />
        </div>
        <Link
          to="/new-listings"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#14532d", color: "#fff", padding: "11px 28px", borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 700, transition: "opacity 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          View all new listings →
        </Link>
      </div>
    </div>
  );
}
