import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { getJobs } from "../api/jobs";
import { getRooms } from "../api/rooms";
import { getEvents } from "../api/events";
import ExchangeRates from "../components/ui/ExchangeRates";
import useAuthStore from "../store/authStore";
import usePageTitle from "../hooks/usePageTitle";
import {
  getSearchSuggestions,
  getStats,
  getFeaturedListings,
} from "../api/listings";

const CATEGORIES = [
  {
    to: "/jobs",
    emoji: "💼",
    label: "Jobs",
    desc: "Find work near you",
    color: "#EEEDFE",
    border: "#AFA9EC",
  },
  {
    to: "/rooms",
    emoji: "🏠",
    label: "Rooms",
    desc: "Affordable rentals",
    color: "#FFF1E0",
    border: "#EFD9C0",
  },
  {
    to: "/events",
    emoji: "🎉",
    label: "Events",
    desc: "Community gatherings",
    color: "#E1F5EE",
    border: "#9FE1CB",
  },
  {
    to: "/announcements",
    emoji: "📢",
    label: "Announcements",
    desc: "News and updates",
    color: "#E6F1FB",
    border: "#B5D4F4",
  },
  {
    to: "/businesses",
    emoji: "🏪",
    label: "Businesses",
    desc: "Nepalese directory",
    color: "#FAEEDA",
    border: "#FAC775",
  },
];

const STATES = [
  { value: "", label: "All states" },
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "WA", label: "WA" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "NT" },
];

const TYPE_EMOJI = {
  job: "💼",
  room: "🏠",
  event: "🎉",
  announcement: "📢",
  business: "🏪",
};

const SEARCH_TYPES = [
  { value: "all", emoji: "🔍", label: "All" },
  { value: "jobs", emoji: "💼", label: "Jobs" },
  { value: "rooms", emoji: "🏠", label: "Rooms" },
  { value: "events", emoji: "🎉", label: "Events" },
  { value: "announcements", emoji: "📢", label: "Announcements" },
  { value: "businesses", emoji: "🏪", label: "Businesses" },
];

/* ─── helpers ─────────────────────────────────────────── */

/** Relative time string */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Card accent colours per listing type */
const CARD_ACCENT = {
  job: { footer: "#534AB7", time: "#534AB7", bg: "#EEEDFE" },
  room: { footer: "#E87722", time: "#E87722", bg: "#FFF1E0" },
  event: { footer: "#1D9E75", time: "#1D9E75", bg: "#E1F5EE" },
  announcement: { footer: "#0C447C", time: "#2176AE", bg: "#E6F1FB" },
  business: { footer: "#8B5E00", time: "#B47D00", bg: "#FAEEDA" },
  default: { footer: "#26215C", time: "#534AB7", bg: "#F5F4F0" },
};

/**
 * Desktop card — matches the image: coloured top strip + thumbnail emoji,
 * timestamp, bold title, description, coloured stats footer.
 */
function DesktopCard({
  to,
  accentType,
  emoji,
  timeStr,
  title,
  subtitle,
  description,
  stats,
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
        border: "0.5px solid #e5e5e5",
        boxShadow: hovered
          ? "0 8px 28px rgba(0,0,0,0.13)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.2s, transform 0.2s",
        minHeight: "320px",
      }}
    >
      {/* Coloured top strip / thumbnail */}
      <div
        style={{
          background: accent.bg,
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
        {/* subtle corner accent bar */}
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

      {/* Body */}
      <div
        style={{
          padding: "16px 18px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {/* Timestamp */}
        {timeStr && (
          <div
            style={{ fontSize: "12px", fontWeight: 600, color: accent.time }}
          >
            {timeStr}
          </div>
        )}

        {/* Title */}
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

        {/* Subtitle / location */}
        {subtitle && (
          <div style={{ fontSize: "12px", color: "#888", marginTop: "1px" }}>
            {subtitle}
          </div>
        )}

        {/* Description */}
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

      {/* Coloured stats footer */}
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
            <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.82, marginTop: "2px" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

/**
 * Featured variant — same card shape but with a gradient ⭐ FEATURED badge
 * in the header strip and an orange/purple gradient footer instead of stats.
 */
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
        boxShadow: hovered
          ? "0 8px 28px rgba(0,0,0,0.13)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
        minHeight: "300px",
        // Scroll row: fixed width + snap
        ...(scrollCard && {
          width: "260px",
          flexShrink: 0,
          scrollSnapAlign: "start",
        }),
      }}
    >
      {/* Coloured top strip */}
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
        {/* ⭐ FEATURED badge pinned to top-left */}
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
        {/* Type badge top-right */}
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
        {/* bottom accent line */}
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

      {/* Body */}
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
          <div style={{ fontSize: "12px", color: "#888", marginTop: "1px" }}>
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

      {/* Gradient footer */}
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
        <span
          style={{
            color: "#fff",
            fontSize: "11px",
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          Featured listing
        </span>
        <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
          View →
        </span>
      </div>
    </Link>
  );
}

/* ─── JB Hi-Fi style featured carousel ─── */
function FeaturedCarousel({ listings }) {
  const scrollRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const CARD_W = 264; // card width + gap

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_W * 3, behavior: "smooth" });
  };

  return (
    <div
      className="home-section"
      style={{ padding: "0 0 32px", maxWidth: "1000px", margin: "0 auto" }}
    >
      {/* Header row */}
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
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#26215C",
              margin: 0,
            }}
          >
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
        {/* Desktop arrows */}
        <div
          className="feat-arrows"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: `1.5px solid ${canLeft ? "#AFA9EC" : "#e5e5e5"}`,
              background: canLeft ? "#EEEDFE" : "#F5F4F0",
              color: canLeft ? "#534AB7" : "#ccc",
              fontSize: "16px",
              cursor: canLeft ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: `1.5px solid ${canRight ? "#AFA9EC" : "#e5e5e5"}`,
              background: canRight ? "#EEEDFE" : "#F5F4F0",
              color: canRight ? "#534AB7" : "#ccc",
              fontSize: "16px",
              cursor: canRight ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Scroll row */}
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
          const typeEmoji =
            { job: "💼", room: "🏠", event: "🎉", announcement: "📢" }[
              listing.listing_type
            ] || "📌";
          const typeBg =
            {
              job: "#EEEDFE",
              room: "#FFF1E0",
              event: "#E1F5EE",
              announcement: "#E6F1FB",
            }[listing.listing_type] || "#F5F4F0";
          const typeColor =
            {
              job: "#3C3489",
              room: "#633806",
              event: "#085041",
              announcement: "#0C447C",
            }[listing.listing_type] || "#444";
          const typePath =
            {
              job: "jobs",
              room: "rooms",
              event: "events",
              announcement: "announcements",
            }[listing.listing_type] || "listings";
          const accent =
            CARD_ACCENT[listing.listing_type] || CARD_ACCENT.default;
          return (
            <FeaturedDesktopCard
              key={listing.id}
              to={`/${typePath}/${listing.slug}`}
              emoji={typeEmoji}
              accentBg={typeBg}
              accentFooter={accent.footer}
              accentTime={accent.time}
              typeBg={typeBg}
              typeColor={typeColor}
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

      {/* Progress bar + View all button */}
      <div
        style={{
          padding: "0 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {/* Track */}
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "#e5e5e5",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
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
        {/* View all button */}
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

/* ─── Section wrapper that switches mobile list ↔ desktop grid ─── */
function ListingSection({
  title,
  viewAllTo,
  viewAllColor,
  items,
  renderRow,
  renderCard,
}) {
  if (!items?.length) return null;
  return (
    <div
      className="home-section"
      style={{ padding: "0 28px 32px", maxWidth: "1000px", margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#26215C",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <Link
          to={viewAllTo}
          style={{
            fontSize: "13px",
            color: viewAllColor,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          View all →
        </Link>
      </div>

      {/* Mobile list */}
      <div
        className="listing-mobile"
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        {items.map((item) => renderRow(item))}
      </div>

      {/* Desktop grid */}
      <div
        className="listing-desktop"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        {items.map((item) => renderCard(item))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function HomePage() {
  usePageTitle(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [state, setState] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: featuredData } = useQuery({
    queryKey: ["home-featured"],
    queryFn: getFeaturedListings,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const data = await getSearchSuggestions(search);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim() && !state) return;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search);
    if (state) params.set("state", state);
    if (searchType === "all") navigate(`/search?${params}`);
    else if (searchType === "jobs") navigate(`/jobs?${params}`);
    else if (searchType === "rooms") navigate(`/rooms?${params}`);
    else if (searchType === "events") navigate(`/events?${params}`);
    else if (searchType === "businesses") navigate(`/businesses?${params}`);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span style={{ color: "#534AB7", fontWeight: 700 }}>
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const { data: jobsData } = useQuery({
    queryKey: ["home-jobs"],
    queryFn: () => getJobs({ page_size: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["home-rooms"],
    queryFn: () => getRooms({ page_size: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["home-events"],
    queryFn: () => getEvents({ upcoming: "true", page_size: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <style>{`
        /* ── mobile-only: hide desktop grid ── */
        @media (max-width: 767px) {
          .listing-desktop { display: none !important; }
          .listing-mobile  { display: flex !important; }
          .hero-section    { padding: 40px 16px 32px !important; }
          .hero-title      { font-size: 28px !important; letter-spacing: -0.3px !important; }
          .home-section    { padding-left: 16px !important; padding-right: 16px !important; }
          .cta-inner       { padding: 24px 20px !important; }
          .stats-grid      { gap: 8px !important; }
          .stat-num        { font-size: 18px !important; }
          .search-btn-text { display: none !important; }
          .feat-scroll     { padding-left: 16px !important; padding-right: 16px !important; }
          .feat-arrows     { display: none !important; }
        }

        /* ── desktop: hide mobile list ── */
        @media (min-width: 768px) {
          .listing-mobile  { display: none !important; }
          .listing-desktop { display: grid !important; }
          .search-btn-text { display: inline !important; }
        }

        /* ── Featured scroll: always flex, never grid, hide scrollbar ── */
        .feat-scroll                      { display: flex !important; overflow-x: auto; }
        .feat-scroll::-webkit-scrollbar   { display: none; }

        @media (max-width: 480px) {
          .search-btn-text { display: none !important; }
        }
        @media (min-width: 481px) and (max-width: 767px) {
          .search-btn-text { display: inline !important; }
        }
      `}</style>

      <div style={{ background: "#F5F4F0", minHeight: "100vh" }}>
        {/* ── HERO ── */}
        <div
          className="hero-section"
          style={{
            background: "#FFF1E0",
            borderBottom: "0.5px solid #EFD9C0",
            padding: "60px 28px 48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#EEEDFE",
              border: "0.5px solid #AFA9EC",
              borderRadius: "20px",
              padding: "5px 14px",
              fontSize: "12px",
              color: "#534AB7",
              fontWeight: 500,
              marginBottom: "16px",
              letterSpacing: "0.03em",
            }}
          >
            नेपसाथी · your Nepali friend, wherever you are
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "#26215C",
              maxWidth: "580px",
              margin: "0 auto 16px",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}
          >
            Find <span style={{ color: "#E87722" }}>work</span> and a place to{" "}
            <span style={{ color: "#E87722" }}>call home</span>
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#633806",
              maxWidth: "460px",
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}
          >
            The Nepalese community hub for jobs, rooms, events and businesses
            across Australia.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            style={{
              maxWidth: "600px",
              margin: "0 auto 24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              position: "relative",
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: "flex",
                border: "1.5px solid #AFA9EC",
                borderRadius: "12px",
                overflow: "visible",
                background: "#fff",
                position: "relative",
              }}
            >
              {/* Type dropdown */}
              <div
                style={{ position: "relative", flexShrink: 0 }}
                ref={dropdownRef}
              >
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    padding: "0 10px",
                    height: "100%",
                    borderRight: "0.5px solid #e5e5e5",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "18px",
                    minWidth: "56px",
                  }}
                >
                  {SEARCH_TYPES.find((t) => t.value === searchType)?.emoji}
                  <span style={{ fontSize: "10px", color: "#aaa" }}>▼</span>
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      background: "#fff",
                      borderRadius: "12px",
                      border: "0.5px solid #e5e5e5",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      zIndex: 999,
                      overflow: "hidden",
                      minWidth: "160px",
                    }}
                  >
                    {SEARCH_TYPES.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => {
                          setSearchType(type.value);
                          setDropdownOpen(false);
                        }}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "13px",
                          color: searchType === type.value ? "#534AB7" : "#333",
                          fontWeight: searchType === type.value ? 600 : 400,
                          background:
                            searchType === type.value
                              ? "#EEEDFE"
                              : "transparent",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (searchType !== type.value)
                            e.currentTarget.style.background = "#F5F4F0";
                        }}
                        onMouseLeave={(e) => {
                          if (searchType !== type.value)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>{type.emoji}</span>
                        {type.label}
                        {searchType === type.value && (
                          <span
                            style={{ marginLeft: "auto", fontSize: "11px" }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ flex: 1, position: "relative" }} ref={searchRef}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() =>
                    suggestions.length > 0 && setShowSuggestions(true)
                  }
                  placeholder={
                    searchType === "all"
                      ? "Search jobs, rooms, events..."
                      : searchType === "jobs"
                        ? "Search jobs..."
                        : searchType === "rooms"
                          ? "Search rooms..."
                          : searchType === "events"
                            ? "Search events..."
                            : searchType === "announcements"
                              ? "Search announcements..."
                              : "Search businesses..."
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    padding: "14px 12px",
                    color: "#333",
                    background: "transparent",
                    boxSizing: "border-box",
                  }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      borderRadius: "12px",
                      border: "0.5px solid #e5e5e5",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      zIndex: 999,
                      overflow: "hidden",
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearch(suggestion.label);
                          const params = new URLSearchParams();
                          params.set("search", suggestion.label);
                          navigate(`/${suggestion.listing_type}s?${params}`);
                        }}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          borderBottom:
                            index < suggestions.length - 1
                              ? "0.5px solid #f5f5f5"
                              : "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F5F4F0")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                      >
                        <span style={{ fontSize: "16px" }}>
                          {TYPE_EMOJI[suggestion.listing_type] || "🔍"}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#26215C",
                            }}
                          >
                            {highlightMatch(suggestion.label, search)}
                          </div>
                          <div style={{ fontSize: "11px", color: "#888" }}>
                            {suggestion.sublabel}
                          </div>
                        </div>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "11px",
                            color: "#aaa",
                          }}
                        >
                          {suggestion.listing_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                aria-label="Search listings"
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  border: "none",
                  padding: "0 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: "0 10px 10px 0",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="search-btn-text">Search</span>
              </button>
            </div>

            {/* State filters */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {STATES.filter((s) => s.value).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setState(state === value ? "" : value)}
                  style={{
                    background:
                      state === value ? "#534AB7" : "rgba(255,255,255,0.8)",
                    color: state === value ? "#fff" : "#534AB7",
                    border: "0.5px solid #AFA9EC",
                    borderRadius: "20px",
                    padding: "4px 14px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </form>

          <ExchangeRates />
        </div>

        {/* ── CATEGORIES ── */}
        <div
          className="home-section"
          style={{
            padding: "36px 28px 0",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {CATEGORIES.map(({ to, emoji, label, desc, color, border }) => (
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <span style={{ fontSize: "24px" }}>{emoji}</span>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#26215C",
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div
          className="home-section stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            padding: "28px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {[
            {
              num: statsData ? `${statsData.total_jobs}+` : "0",
              label: "Active job listings",
              color: "#E87722",
            },
            {
              num: statsData ? `${statsData.total_rooms}+` : "0",
              label: "Rooms available",
              color: "#534AB7",
            },
            {
              num: statsData ? `${statsData.total_members}+` : "0",
              label: "Community members",
              color: "#26215C",
            },
          ].map(({ num, label, color }) => (
            <div
              key={label}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "center",
                border: "0.5px solid #e5e5e5",
              }}
            >
              <div
                className="stat-num"
                style={{ fontSize: "28px", fontWeight: 700, color }}
              >
                {num}
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── FEATURED POSTS ── */}
        {featuredData?.results?.length > 0 && (
          <FeaturedCarousel listings={featuredData.results.slice(0, 8)} />
        )}

        {/* ── LATEST JOBS ── */}
        <ListingSection
          title="Latest jobs"
          viewAllTo="/jobs"
          viewAllColor="#534AB7"
          items={jobsData?.results}
          /* Mobile row (unchanged) */
          renderRow={(job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.listing_slug}`}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "12px",
                padding: "16px 20px",
                textDecoration: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#AFA9EC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e5e5")
              }
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#EEEDFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  💼
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#26215C",
                      marginBottom: "3px",
                    }}
                  >
                    {job.listing_title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    {job.company_name} · {job.listing_location},{" "}
                    {job.listing_state}
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "#EEEDFE",
                  color: "#3C3489",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {job.salary_display}
              </div>
            </Link>
          )}
          /* Desktop card */
          renderCard={(job) => (
            <DesktopCard
              key={job.id}
              to={`/jobs/${job.listing_slug}`}
              accentType="job"
              emoji="💼"
              timeStr={timeAgo(job.created_at || job.date_posted)}
              title={job.listing_title}
              subtitle={`${job.company_name} · ${job.listing_location}, ${job.listing_state}`}
              description={job.description || job.listing_description}
              stats={[
                { value: job.salary_display || "—", label: "Salary" },
                { value: job.job_type || "—", label: "Type" },
                { value: job.listing_state || "—", label: "State" },
              ]}
            />
          )}
        />

        {/* ── LATEST ROOMS ── */}
        <ListingSection
          title="Rooms available"
          viewAllTo="/rooms"
          viewAllColor="#E87722"
          items={roomsData?.results}
          renderRow={(room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.listing_slug}`}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "12px",
                padding: "16px 20px",
                textDecoration: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#EFD9C0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e5e5")
              }
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#FFF1E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  🏠
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#26215C",
                      marginBottom: "3px",
                    }}
                  >
                    {room.listing_title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      📍 {room.listing_location}, {room.listing_state}
                    </span>
                    {room.nepalese_household && <span>· 🇳🇵 Nepalese home</span>}
                    {room.room_type && (
                      <span>· {room.room_type.replace("_", " ")}</span>
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "#FFF1E0",
                  color: "#633806",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {room.price_display}
              </div>
            </Link>
          )}
          renderCard={(room) => (
            <DesktopCard
              key={room.id}
              to={`/rooms/${room.listing_slug}`}
              accentType="room"
              emoji="🏠"
              timeStr={timeAgo(room.created_at || room.date_posted)}
              title={room.listing_title}
              subtitle={`📍 ${room.listing_location}, ${room.listing_state}`}
              description={room.description || room.listing_description}
              stats={[
                { value: room.price_display || "—", label: "Price" },
                {
                  value: room.room_type?.replace("_", " ") || "—",
                  label: "Type",
                },
                {
                  value: room.nepalese_household ? "🇳🇵 Yes" : "No",
                  label: "Nepali home",
                },
              ]}
            />
          )}
        />

        {/* ── UPCOMING EVENTS ── */}
        <ListingSection
          title="Upcoming events"
          viewAllTo="/events"
          viewAllColor="#1D9E75"
          items={eventsData?.results}
          renderRow={(event) => (
            <Link
              key={event.id}
              to={`/events/${event.listing_slug}`}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#9FE1CB")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e5e5")
              }
            >
              <div
                style={{
                  background: "#EEEDFE",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  textAlign: "center",
                  minWidth: "48px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#26215C",
                    lineHeight: 1,
                  }}
                >
                  {new Date(event.event_date).getDate()}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#534AB7",
                    fontWeight: 500,
                  }}
                >
                  {new Date(event.event_date)
                    .toLocaleDateString("en-AU", { month: "short" })
                    .toUpperCase()}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#26215C",
                    marginBottom: "3px",
                  }}
                >
                  {event.listing_title}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {event.venue ||
                    `${event.listing_location}, ${event.listing_state}`}
                </div>
              </div>
              <div
                style={{
                  background: event.is_free ? "#E1F5EE" : "#FFF1E0",
                  color: event.is_free ? "#085041" : "#633806",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {event.ticket_display}
              </div>
            </Link>
          )}
          renderCard={(event) => (
            <DesktopCard
              key={event.id}
              to={`/events/${event.listing_slug}`}
              accentType="event"
              emoji="🎉"
              timeStr={
                event.event_date
                  ? new Date(event.event_date).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""
              }
              title={event.listing_title}
              subtitle={
                event.venue ||
                `${event.listing_location}, ${event.listing_state}`
              }
              description={event.description || event.listing_description}
              stats={[
                { value: event.ticket_display || "—", label: "Tickets" },
                { value: event.is_free ? "Free" : "Paid", label: "Entry" },
                { value: event.listing_state || "—", label: "State" },
              ]}
            />
          )}
        />

        {/* ── CTA BANNER ── */}
        <div
          className="home-section"
          style={{
            padding: "0 28px 48px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
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
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "8px",
                }}
              >
                Have something to share?
              </h2>
              <p
                style={{ fontSize: "14px", color: "#AFA9EC", lineHeight: 1.6 }}
              >
                Post a job, room, event or announcement — reach thousands of
                Nepalese Australians instantly.
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
      </div>
    </>
  );
}
