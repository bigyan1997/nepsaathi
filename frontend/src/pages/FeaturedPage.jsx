import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedListings } from "../api/listings";
import { SkeletonRoomCard } from "../components/ui/Skeleton";
import usePageTitle from "../hooks/usePageTitle";

/* ── constants ── */
const TYPE_CONFIG = {
  job: {
    emoji: "💼",
    label: "Jobs",
    bg: "#EEEDFE",
    border: "#AFA9EC",
    color: "#3C3489",
    path: "jobs",
  },
  room: {
    emoji: "🏠",
    label: "Rooms",
    bg: "#FFF1E0",
    border: "#EFD9C0",
    color: "#633806",
    path: "rooms",
  },
  event: {
    emoji: "🎉",
    label: "Events",
    bg: "#E1F5EE",
    border: "#9FE1CB",
    color: "#085041",
    path: "events",
  },
  announcement: {
    emoji: "📢",
    label: "Announcements",
    bg: "#E6F1FB",
    border: "#B5D4F4",
    color: "#0C447C",
    path: "announcements",
  },
};

const CARD_ACCENT = {
  job: { footer: "#534AB7", time: "#534AB7" },
  room: { footer: "#E87722", time: "#E87722" },
  event: { footer: "#1D9E75", time: "#1D9E75" },
  announcement: { footer: "#0C447C", time: "#0C447C" },
  default: { footer: "#534AB7", time: "#534AB7" },
};

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

const PAGE_SIZE = 12;

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

/* ── Card component ── */
function FeaturedCard({ listing }) {
  const [hovered, setHovered] = useState(false);
  const cfg = TYPE_CONFIG[listing.listing_type] || TYPE_CONFIG.job;
  const accent = CARD_ACCENT[listing.listing_type] || CARD_ACCENT.default;

  return (
    <Link
      to={`/${cfg.path}/listing/${listing.id}`}
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
          ? "0 8px 28px rgba(0,0,0,0.12)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.2s",
      }}
    >
      {/* Coloured top strip */}
      <div
        style={{
          background: cfg.bg,
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "44px",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {cfg.emoji}
        {/* ⭐ FEATURED badge */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "linear-gradient(135deg,#E87722,#534AB7)",
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
        {/* Type badge */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: cfg.bg,
            color: cfg.color,
            fontSize: "9px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {listing.listing_type?.toUpperCase()}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: accent.footer,
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
        {listing.created_at && (
          <div
            style={{ fontSize: "12px", fontWeight: 600, color: accent.time }}
          >
            {timeAgo(listing.created_at)}
          </div>
        )}
        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {listing.title}
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>
          📍 {listing.location}, {listing.state}
        </div>
        {listing.description && (
          <div
            style={{
              fontSize: "13px",
              color: "#555",
              lineHeight: 1.55,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {listing.description}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "linear-gradient(135deg,#E87722,#534AB7)",
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

/* ── Pagination ── */
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = (active) => ({
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: active ? 700 : 400,
    cursor: active ? "default" : "pointer",
    border: `0.5px solid ${active ? "#26215C" : "#e5e5e5"}`,
    background: active ? "#26215C" : "#fff",
    color: active ? "#fff" : "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  });

  const nav = (disabled) => ({
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    fontSize: "16px",
    border: "0.5px solid #e5e5e5",
    background: "#fff",
    color: disabled ? "#ccc" : "#534AB7",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        paddingTop: "24px",
      }}
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={nav(page === 1)}
      >
        ‹
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} style={btn(false)}>
            1
          </button>
          {start > 2 && (
            <span style={{ color: "#aaa", fontSize: "13px" }}>…</span>
          )}
        </>
      )}
      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)} style={btn(p === page)}>
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span style={{ color: "#aaa", fontSize: "13px" }}>…</span>
          )}
          <button onClick={() => onChange(totalPages)} style={btn(false)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        style={nav(page === totalPages)}
      >
        ›
      </button>
      <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "8px" }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
        {total}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function FeaturedPage() {
  usePageTitle("Featured Listings");
  const [filterType, setFilterType] = useState("");
  const [filterState, setFilterState] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["featured-all"],
    queryFn: getFeaturedListings,
  });

  const allListings = data?.results || [];

  /* client-side filter + paginate */
  const filtered = useMemo(() => {
    return allListings.filter((l) => {
      if (filterType && l.listing_type !== filterType) return false;
      if (filterState && l.state !== filterState) return false;
      return true;
    });
  }, [allListings, filterType, filterState]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (update) => {
    if ("type" in update) setFilterType(update.type);
    if ("state" in update) setFilterState(update.state);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        .fp-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .fp-types { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 900px) { .fp-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) {
          .fp-grid       { grid-template-columns: 1fr !important; }
          .fp-types      { flex-wrap: nowrap !important; overflow-x: auto !important; padding-bottom: 2px !important; width: 100% !important; scrollbar-width: none !important; -ms-overflow-style: none !important; }
          .fp-types::-webkit-scrollbar { display: none; }
          .fp-filter-row { flex-direction: column !important; gap: 10px !important; }
          .fp-state      { width: 100% !important; margin-left: 0 !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Hero banner ── */}
        <div
          style={{
            background: "#26215C",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#AFA9EC",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            PROMOTED
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: "0 0 6px",
                }}
              >
                ⭐ Featured listings
              </h1>
              <p style={{ fontSize: "13px", color: "#AFA9EC", margin: 0 }}>
                {isLoading
                  ? "Loading…"
                  : `${filtered.length} featured listing${filtered.length !== 1 ? "s" : ""} from the NepSaathi community`}
              </p>
            </div>
            <Link
              to="/"
              style={{
                fontSize: "13px",
                color: "#AFA9EC",
                textDecoration: "none",
                alignSelf: "center",
              }}
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* ── Filters ── */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5e5e5",
            borderRadius: "14px",
            padding: "14px 16px",
            marginBottom: "14px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
          className="fp-filter-row"
        >
          {/* Type filter pills — scrollable on mobile */}
          <div className="fp-types" style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={() => handleFilter({ type: "" })}
              style={{
                background: !filterType ? "#26215C" : "#F5F4F0",
                color: !filterType ? "#fff" : "#555",
                border: "none",
                borderRadius: "20px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              All
            </button>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleFilter({ type: key })}
                style={{
                  background: filterType === key ? cfg.bg : "#F5F4F0",
                  color: filterType === key ? cfg.color : "#555",
                  border: `0.5px solid ${filterType === key ? cfg.border : "transparent"}`,
                  borderRadius: "20px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "14px" }}>{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>

          {/* State filter */}
          <select
            className="fp-state"
            value={filterState}
            onChange={(e) => handleFilter({ state: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#F5F4F0",
              color: "#444",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {STATES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="fp-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonRoomCard key={i} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              color: "#A32D2D",
            }}
          >
            Failed to load featured listings. Please try again.
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "64px 28px",
              background: "#fff",
              borderRadius: "16px",
              border: "0.5px solid #e5e5e5",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>⭐</div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#26215C",
                marginBottom: "6px",
              }}
            >
              {filterType || filterState
                ? "No featured listings match your filters"
                : "No featured listings yet"}
            </h2>
            <p
              style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}
            >
              {filterType || filterState
                ? "Try removing a filter"
                : "Check back soon!"}
            </p>
            {(filterType || filterState) && (
              <button
                onClick={() => {
                  setFilterType("");
                  setFilterState("");
                  setPage(1);
                }}
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Cards grid ── */}
        {!isLoading && paginated.length > 0 && (
          <>
            <div className="fp-grid">
              {paginated.map((listing) => (
                <FeaturedCard key={listing.id} listing={listing} />
              ))}
            </div>

            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
