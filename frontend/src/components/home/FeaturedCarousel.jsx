import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { CARD_ACCENT, timeAgo } from "./homeUtils";

function FeaturedDesktopCard({
  to,
  emoji,
  accentBg,
  accentFooter,
  accentTime,
  typeBg,
  typeColor,
  typeLabel,
  timeStr,
  title,
  subtitle,
  description,
  scrollCard,
}) {
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
        border: `1.5px solid ${hovered ? "#534AB7" : "#E87722"}`,
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.13)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
        minHeight: "300px",
        ...(scrollCard && { width: "260px", flexShrink: 0, scrollSnapAlign: "start" }),
      }}
    >
      <div
        style={{
          background: accentBg,
          height: "110px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "48px",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {emoji}
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
          }}
        >
          ⭐ FEATURED
        </div>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: typeBg,
            color: typeColor,
            fontSize: "9px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {typeLabel}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: accentFooter,
            opacity: 0.4,
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
          <div style={{ fontSize: "12px", fontWeight: 600, color: accentTime }}>
            {timeStr}
          </div>
        )}
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#26215C", lineHeight: 1.25 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: "12px", color: "#888", marginTop: "1px" }}>{subtitle}</div>
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
          background: "linear-gradient(135deg, #E87722, #534AB7)",
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#fff", fontSize: "11px", fontWeight: 600, opacity: 0.9 }}>
          Featured listing
        </span>
        <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>View →</span>
      </div>
    </Link>
  );
}

const TYPE_META = {
  job:    { emoji: "💼", bg: "#EEEDFE", color: "#3C3489", path: "jobs" },
  room:   { emoji: "🏠", bg: "#FFF1E0", color: "#633806", path: "rooms" },
  event:  { emoji: "🎉", bg: "#E1F5EE", color: "#085041", path: "events" },
  notice: { emoji: "📢", bg: "#E6F1FB", color: "#0C447C", path: "notices" },
};

export default function FeaturedCarousel({ listings }) {
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
    <div className="home-section" style={{ padding: "0 0 32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
          padding: "0 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>⭐</span>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#26215C", margin: 0 }}>
            Featured posts
          </h2>
          <span
            style={{
              background: "#FFF1E0",
              color: "#633806",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "20px",
            }}
          >
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
                border: `1.5px solid ${can ? "#AFA9EC" : "#e5e5e5"}`,
                background: can ? "#EEEDFE" : "#F5F4F0",
                color: can ? "#534AB7" : "#ccc",
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
          const meta = TYPE_META[listing.listing_type] || { emoji: "📌", bg: "#F5F4F0", color: "#444", path: "listings" };
          const accent = CARD_ACCENT[listing.listing_type] || CARD_ACCENT.default;
          return (
            <FeaturedDesktopCard
              key={listing.id}
              to={`/${meta.path}/${listing.slug}`}
              emoji={meta.emoji}
              accentBg={meta.bg}
              accentFooter={accent.footer}
              accentTime={accent.time}
              typeBg={meta.bg}
              typeColor={meta.color}
              typeLabel={listing.listing_type?.toUpperCase()}
              timeStr={timeAgo(listing.created_at || listing.date_posted)}
              title={listing.title}
              subtitle={`📍 ${listing.location}, ${listing.state}`}
              description={listing.description || listing.listing_description}
              scrollCard
            />
          );
        })}
      </div>

      <div style={{ padding: "0 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "100%", height: "3px", background: "#e5e5e5", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: "30%",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #E87722, #534AB7)",
              transform: `translateX(${scrollPct * 233}%)`,
              transition: "transform 0.15s",
            }}
          />
        </div>
        <Link
          to="/featured"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#26215C",
            color: "#fff",
            padding: "11px 28px",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 700,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          ⭐ View all featured listings
        </Link>
      </div>
    </div>
  );
}
