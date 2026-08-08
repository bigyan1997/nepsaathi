import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { timeAgo } from "./homeUtils";

const TYPE_META = {
  job:    { emoji: "💼", headerBg: "#EEF0FB", accentColor: "#534AB7", typeBg: "#EEEDFE", typeColor: "#3C3489", path: "jobs" },
  room:   { emoji: "🏠", headerBg: "#FFF5EA", accentColor: "#D97706", typeBg: "#FFF1E0", typeColor: "#633806", path: "rooms" },
  event:  { emoji: "🎉", headerBg: "#EDFBF4", accentColor: "#1D9E75", typeBg: "#E1F5EE", typeColor: "#085041", path: "events" },
  notice: { emoji: "📢", headerBg: "#EDF4FC", accentColor: "#0C447C", typeBg: "#E6F1FB", typeColor: "#0C447C", path: "notices" },
};

function FeaturedCard({ listing }) {
  const [hovered, setHovered] = useState(false);
  const meta = TYPE_META[listing.listing_type] || {
    emoji: "📌", headerBg: "#F5F4F0", accentColor: "#555", typeBg: "#F5F4F0", typeColor: "#444", path: "listings",
  };

  return (
    <Link
      to={`/${meta.path}/${listing.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "14px",
        overflow: "hidden",
        textDecoration: "none",
        border: `1.5px solid ${hovered ? meta.accentColor : "#ebebeb"}`,
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.10)` : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
        width: "256px",
        flexShrink: 0,
        scrollSnapAlign: "start",
      }}
    >
      {/* Header image area */}
      <div style={{ background: meta.headerBg, height: "100px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", position: "relative", flexShrink: 0 }}>
        {meta.emoji}

        {/* Featured badge — top left */}
        <div style={{ position: "absolute", top: "9px", left: "9px", background: "linear-gradient(135deg,#E87722,#534AB7)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "5px", letterSpacing: "0.04em" }}>
          ⭐ FEATURED
        </div>

        {/* Type badge — top right */}
        <div style={{ position: "absolute", top: "9px", right: "9px", background: meta.typeBg, color: meta.typeColor, fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "5px" }}>
          {listing.listing_type?.toUpperCase()}
        </div>

        {/* Accent underline */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: meta.accentColor, opacity: 0.25 }} />
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ fontSize: "11px", color: "#bbb", fontWeight: 500 }}>
          {timeAgo(listing.created_at || listing.date_posted)}
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#26215C", lineHeight: 1.3 }}>
          {listing.title}
        </div>
        {(listing.location || listing.state) && (
          <div style={{ fontSize: "12px", color: "#888" }}>
            📍 {listing.location}{listing.location && listing.state ? ", " : ""}{listing.state}
          </div>
        )}
        {(listing.description || listing.listing_description) && (
          <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.55, marginTop: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {listing.description || listing.listing_description}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: "10px 16px", borderTop: "0.5px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", color: "#bbb" }}>Featured listing</span>
        <span style={{ fontSize: "12px", fontWeight: 700, color: meta.accentColor }}>View →</span>
      </div>
    </Link>
  );
}

export default function FeaturedCarousel({ listings }) {
  const scrollRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const CARD_W = 270;

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * CARD_W * 2, behavior: "smooth" });
  };

  return (
    <div className="home-section" style={{ padding: "0 0 32px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#26215C", margin: 0 }}>
            Featured listings
          </h2>
          <span style={{ background: "#FFF1E0", color: "#C05621", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px" }}>
            {listings.length}
          </span>
        </div>
        <div className="feat-arrows" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {[{ dir: -1, can: canLeft, ch: "‹" }, { dir: 1, can: canRight, ch: "›" }].map(({ dir, can, ch }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              disabled={!can}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: `1.5px solid ${can ? "#d0d0d0" : "#ebebeb"}`, background: can ? "#fff" : "#fafafa", color: can ? "#444" : "#ccc", fontSize: "16px", cursor: can ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="feat-scroll"
        style={{ display: "flex", overflowX: "auto", gap: "12px", padding: "4px 28px 12px", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {listings.map((listing) => (
          <FeaturedCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Scroll progress + CTA */}
      <div style={{ padding: "4px 28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "100%", height: "3px", background: "#ebebeb", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "30%", borderRadius: "2px", background: "linear-gradient(90deg,#E87722,#534AB7)", transform: `translateX(${scrollPct * 233}%)`, transition: "transform 0.15s" }} />
        </div>
        <Link
          to="/featured"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#26215C", color: "#fff", padding: "10px 26px", borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 700, transition: "opacity 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          ⭐ View all featured listings
        </Link>
      </div>
    </div>
  );
}
