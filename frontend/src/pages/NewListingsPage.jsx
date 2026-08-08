import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getNewListings } from "../api/listings";
import usePageMeta from "../hooks/usePageMeta";

const TYPE_CONFIG = {
  job:    { emoji: "💼", label: "Jobs",       bg: "#EEEDFE", color: "#3C3489", path: "jobs" },
  room:   { emoji: "🏠", label: "Rooms",      bg: "#FFF1E0", color: "#633806", path: "rooms" },
  event:  { emoji: "🎉", label: "Events",     bg: "#E1F5EE", color: "#085041", path: "events" },
  notice: { emoji: "📢", label: "Notices",    bg: "#E6F1FB", color: "#0C447C", path: "notices" },
};

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const PAGE_SIZE = 12;

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return "Today";
}

function NewCard({ listing }) {
  const cfg = TYPE_CONFIG[listing.listing_type] || TYPE_CONFIG.job;
  return (
    <Link
      to={`/${cfg.path}/${listing.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: "1.5px solid #bbf7d0",
        boxShadow: "0 2px 8px rgba(22,163,74,0.06)",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(22,163,74,0.14)";
        e.currentTarget.style.borderColor = "#16a34a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(22,163,74,0.06)";
        e.currentTarget.style.borderColor = "#bbf7d0";
      }}
    >
      {/* Top strip */}
      <div style={{ background: cfg.bg, height: "90px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", position: "relative", flexShrink: 0 }}>
        {cfg.emoji}
        <div style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>
          NEW
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, background: cfg.bg, color: cfg.color, fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>
          {listing.listing_type?.toUpperCase()}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "#16a34a", opacity: 0.4 }} />
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
        {listing.created_at && (
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a" }}>{timeAgo(listing.created_at)}</div>
        )}
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#26215C", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {listing.title}
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>📍 {listing.location}, {listing.state}</div>
        {listing.description && (
          <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.5, flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {listing.description}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: "#f0fdf4", borderTop: "1px solid #bbf7d0", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ color: "#15803d", fontSize: "11px", fontWeight: 600 }}>Posted today</span>
        <span style={{ color: "#15803d", fontSize: "13px", fontWeight: 600 }}>View →</span>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #e5e5e5", background: "#fff" }}>
      <div style={{ height: 90, background: "#f0f0f0", animation: "pulse 1.5s infinite" }} />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 10, width: "30%", borderRadius: 4, background: "#e8e8e8", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 14, width: "80%", borderRadius: 4, background: "#e8e8e8", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 10, width: "50%", borderRadius: 4, background: "#e8e8e8", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  const btn = (active) => ({ width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 400, cursor: active ? "default" : "pointer", border: `0.5px solid ${active ? "#16a34a" : "#e5e5e5"}`, background: active ? "#16a34a" : "#fff", color: active ? "#fff" : "#555", display: "flex", alignItems: "center", justifyContent: "center" });
  const nav = (disabled) => ({ width: 36, height: 36, borderRadius: 8, fontSize: 16, border: "0.5px solid #e5e5e5", background: "#fff", color: disabled ? "#ccc" : "#16a34a", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 24 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={nav(page === 1)}>‹</button>
      {start > 1 && <><button onClick={() => onChange(1)} style={btn(false)}>1</button>{start > 2 && <span style={{ color: "#aaa", fontSize: 13 }}>…</span>}</>}
      {pages.map((p) => <button key={p} onClick={() => onChange(p)} style={btn(p === page)}>{p}</button>)}
      {end < totalPages && <>{end < totalPages - 1 && <span style={{ color: "#aaa", fontSize: 13 }}>…</span>}<button onClick={() => onChange(totalPages)} style={btn(false)}>{totalPages}</button></>}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={nav(page === totalPages)}>›</button>
      <span style={{ fontSize: 12, color: "#aaa", marginLeft: 8 }}>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
    </div>
  );
}

export default function NewListingsPage() {
  usePageMeta("New Listings", "The latest listings posted in the last 24 hours on NepSaathi — jobs, rooms, events and notices from the Nepalese community in Australia.");
  const [filterType, setFilterType] = useState("");
  const [filterState, setFilterState] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["new-listings", filterType, filterState, page],
    queryFn: () => getNewListings({
      ...(filterType && { listing_type: filterType }),
      ...(filterState && { state: filterState }),
      page,
      page_size: PAGE_SIZE,
    }),
    staleTime: 1000 * 60,
  });

  const listings = data?.results || [];
  const total = data?.count || 0;

  const handleFilter = (update) => {
    if ("type" in update) setFilterType(update.type);
    if ("state" in update) setFilterState(update.state);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .nl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .nl-types { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 900px) { .nl-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) {
          .nl-grid  { grid-template-columns: 1fr !important; }
          .nl-types { flex-wrap: nowrap !important; overflow-x: auto !important; padding-bottom: 2px !important; scrollbar-width: none !important; -ms-overflow-style: none !important; }
          .nl-types::-webkit-scrollbar { display: none; }
          .nl-filter-row { flex-direction: column !important; gap: 10px !important; }
          .nl-state { width: 100% !important; margin-left: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 28px", background: "#F5F4F0", minHeight: "100vh" }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #14532d, #16a34a)", borderRadius: 16, padding: "20px 24px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#86efac", letterSpacing: "0.06em", marginBottom: 6 }}>FRESH LISTINGS</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>🆕 New listings</h1>
              <p style={{ fontSize: 13, color: "#86efac", margin: 0 }}>
                {isLoading ? "Loading…" : `${total} listing${total !== 1 ? "s" : ""} posted in the last 24 hours`}
              </p>
            </div>
            <Link to="/" style={{ fontSize: 13, color: "#86efac", textDecoration: "none", alignSelf: "center" }}>← Back to home</Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
          <div className="nl-filter-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="nl-types" style={{ flex: 1 }}>
              {[{ value: "", label: "All types" }, ...Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: `${c.emoji} ${c.label}` }))].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFilter({ type: value })}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: filterType === value ? "1.5px solid #16a34a" : "1px solid #e5e5e5",
                    background: filterType === value ? "#f0fdf4" : "#fff",
                    color: filterType === value ? "#15803d" : "#555",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              className="nl-state"
              value={filterState}
              onChange={(e) => handleFilter({ state: e.target.value })}
              style={{ padding: "7px 12px", borderRadius: 10, fontSize: 13, border: "1px solid #e5e5e5", background: "#fff", color: "#444", cursor: "pointer", marginLeft: "auto", flexShrink: 0 }}
            >
              <option value="">All states</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="nl-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#26215C", marginBottom: 6 }}>No new listings yet</div>
            <p style={{ fontSize: 13, margin: 0 }}>Check back soon — new listings are posted throughout the day.</p>
            <Link to="/post-ad" style={{ display: "inline-block", marginTop: 16, background: "#16a34a", color: "#fff", padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Post the first one →
            </Link>
          </div>
        ) : (
          <>
            <div className="nl-grid">
              {listings.map((listing) => <NewCard key={listing.id} listing={listing} />)}
            </div>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </>
        )}
      </div>
    </>
  );
}
