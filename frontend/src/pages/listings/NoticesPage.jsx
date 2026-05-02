import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getNotices } from "../../api/notices";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";
import SaveSearchButton from "../../components/ui/SaveSearchButton";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "news", label: "Community news" },
  { value: "sale", label: "Items for sale" },
  { value: "service", label: "Services offered" },
  { value: "lost_found", label: "Lost & found" },
  { value: "education", label: "Education" },
  { value: "general", label: "General" },
];

const CATEGORY_COLORS = {
  news: { bg: "#EEEDFE", color: "#3C3489" },
  sale: { bg: "#FFF1E0", color: "#633806" },
  service: { bg: "#E1F5EE", color: "#085041" },
  lost_found: { bg: "#FCEBEB", color: "#A32D2D" },
  education: { bg: "#E6F1FB", color: "#0C447C" },
  general: { bg: "#F1EFE8", color: "#444441" },
};

const CATEGORY_EMOJIS = {
  news: "📰",
  sale: "🏷️",
  service: "🛠️",
  lost_found: "🔎",
  education: "📚",
  general: "📢",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const w = Math.floor(days / 7);
  if (w === 1) return "1 week ago";
  if (w < 5) return `${w} weeks ago`;
  const m = Math.floor(days / 30);
  return m === 1 ? "1 month ago" : `${m} months ago`;
}

/* ── Mobile filter drawer ────────────────────────── */
function MobileFilterDrawer({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState({ ...filters });
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const sel = {
    width: "100%",
    border: "0.5px solid #ddd",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "16px",
    background: "#F5F4F0",
    color: "#444",
    outline: "none",
    boxSizing: "border-box",
  };
  const lbl = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          zIndex: 101,
          maxHeight: "88vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 0",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "#e5e5e5",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "0.5px solid #f0f0f0",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#26215C" }}>
            Filters
          </div>
          <button
            onClick={() =>
              setDraft((p) => ({
                ...p,
                category: "",
                state: "",
                is_free: "",
                is_urgent: "",
                ordering: "-listing__is_featured,-listing__created_at",
              }))
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#0C447C",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        </div>
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <div style={lbl}>Category</div>
            <select
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              style={sel}
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={lbl}>State</div>
            <select
              value={draft.state}
              onChange={(e) => set("state", e.target.value)}
              style={sel}
            >
              {STATES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={lbl}>Sort by</div>
            <select
              value={draft.ordering}
              onChange={(e) => set("ordering", e.target.value)}
              style={sel}
            >
              <option value="-listing__created_at">Newest first</option>
              <option value="listing__created_at">Oldest first</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              {
                key: "is_free",
                label: "🎁 Free items only",
                sub: "Items being given away",
                color: "#085041",
                bg: "#E1F5EE",
                border: "#9FE1CB",
              },
              {
                key: "is_urgent",
                label: "🔴 Urgent only",
                sub: "Time-sensitive posts",
                color: "#A32D2D",
                bg: "#FCEBEB",
                border: "#F09595",
              },
            ].map(({ key, label, sub, color, bg, border }) => {
              const on = draft[key] === "true";
              return (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: on ? bg : "#F5F4F0",
                    border: `0.5px solid ${on ? border : "#e5e5e5"}`,
                    borderRadius: "10px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => set(key, e.target.checked ? "true" : "")}
                    style={{
                      width: "18px",
                      height: "18px",
                      flexShrink: 0,
                      accentColor: color,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#26215C",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#888",
                        marginTop: "2px",
                      }}
                    >
                      {sub}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            style={{
              width: "100%",
              background: "#0C447C",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Desktop card ─────────────────────────────────── */
function NoticeCard({ notice }) {
  const [hovered, setHovered] = useState(false);
  const catColor =
    CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.general;
  const catEmoji = CATEGORY_EMOJIS[notice.category] || "📢";
  return (
    <Link
      to={`/notices/${notice.listing_slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: `0.5px solid ${hovered ? "#B5D4F4" : "#e5e5e5"}`,
        boxShadow: hovered
          ? "0 8px 28px rgba(12,68,124,0.13)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.2s",
        minHeight: "300px",
      }}
    >
      <div
        style={{
          background: catColor.bg,
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "44px",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {catEmoji}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "4px",
          }}
        >
          {notice.is_featured && (
            <span
              style={{
                background: "linear-gradient(135deg,#E87722,#534AB7)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
              }}
            >
              ⭐ FEATURED
            </span>
          )}
          {notice.is_urgent && (
            <span
              style={{
                background: "#FCEBEB",
                color: "#A32D2D",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
              }}
            >
              🔴 URGENT
            </span>
          )}
        </div>
        {(notice.price || notice.is_free) && (
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <span
              style={{
                background: notice.is_free ? "#E1F5EE" : "#FFF1E0",
                color: notice.is_free ? "#085041" : "#633806",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              {notice.price_display}
            </span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "#0C447C",
            opacity: 0.3,
          }}
        />
      </div>
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#2176AE" }}>
          {timeAgo(notice.created_at || notice.date_posted)}
        </div>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <span
            style={{
              background: catColor.bg,
              color: catColor.color,
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: "8px",
            }}
          >
            {catEmoji} {notice.category?.replace("_", " ")}
          </span>
          {notice.is_free && (
            <span
              style={{
                background: "#E1F5EE",
                color: "#085041",
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              Free
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {notice.listing_title}
        </div>
        <div style={{ fontSize: "12px", color: "#777" }}>
          📍 {notice.listing_location}, {notice.listing_state}
        </div>
        {notice.description && (
          <div
            style={{
              fontSize: "12px",
              color: "#555",
              lineHeight: 1.5,
              marginTop: "4px",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {notice.description}
          </div>
        )}
      </div>
      <div
        style={{
          background: "#0C447C",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {[
          {
            value: notice.category?.replace("_", " ") || "—",
            label: "Category",
          },
          { value: notice.listing_state || "—", label: "State" },
          { value: notice.posted_by || "—", label: "Posted by" },
        ].map(({ value, label }) => (
          <div
            key={label}
            style={{ textAlign: "center", color: "#fff", minWidth: 0 }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "90px",
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════ */
export default function NoticesPage() {
  usePageTitle("Notices");
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    state: "",
    is_free: "",
    is_urgent: "",
    ordering: "-listing__is_featured,-listing__created_at",
  });
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const prevKey = useRef(null);

  const updateFilters = (u) => {
    setPage(1);
    setFilters((p) => ({ ...p, ...u }));
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["notices", filters, page],
    queryFn: () =>
      getNotices({
        category: filters.category || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
        is_free: filters.is_free || undefined,
        is_urgent: filters.is_urgent || undefined,
        ordering: filters.ordering || undefined,
        page,
      }),
  });

  useEffect(() => {
    if (!data?.results) return;
    const key = JSON.stringify(filters);
    if (key !== prevKey.current || page === 1) {
      setAllResults(data.results);
      prevKey.current = key;
    } else setAllResults((p) => [...p, ...data.results]);
  }, [data]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("search"),
      st = params.get("state");
    if (s || st) {
      setPage(1);
      setFilters((p) => ({ ...p, search: s || "", state: st || "" }));
    }
  }, [location.search]);

  const activeFilterCount = [
    filters.category,
    filters.state,
    filters.is_free,
    filters.is_urgent,
    filters.ordering !== "-listing__is_featured,-listing__created_at" ? "1" : "",
  ].filter(Boolean).length;

  const activeChips = [
    filters.category && {
      key: "category",
      label: CATEGORIES.find((c) => c.value === filters.category)?.label,
      color: CATEGORY_COLORS[filters.category]?.color || "#444",
      bg: CATEGORY_COLORS[filters.category]?.bg || "#F5F4F0",
      border: "#e5e5e5",
    },
    filters.state && {
      key: "state",
      label: filters.state,
      color: "#0C447C",
      bg: "#E6F1FB",
      border: "#B5D4F4",
    },
    filters.is_free && {
      key: "is_free",
      label: "Free only",
      color: "#085041",
      bg: "#E1F5EE",
      border: "#9FE1CB",
    },
    filters.is_urgent && {
      key: "is_urgent",
      label: "Urgent only",
      color: "#A32D2D",
      bg: "#FCEBEB",
      border: "#F09595",
    },
  ].filter(Boolean);

  return (
    <>
      <style>{`
        .an-desktop { display: none !important; }
        .an-mobile  { display: flex !important; }
        .an-fdesk   { display: none !important; }
        .an-fmob    { display: flex !important; }
        @media (min-width: 768px) {
          .an-mobile { display: none !important; }
          .an-desktop{ display: grid !important; }
          .an-fmob   { display: none !important; }
          .an-fdesk  { display: flex !important; }
        }
      `}</style>

      {drawerOpen && (
        <MobileFilterDrawer
          filters={filters}
          onApply={(d) => {
            setPage(1);
            setFilters(d);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px" }}>
        <div style={{ marginBottom: "18px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "4px",
            }}
          >
            Notices
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Community news, items for sale and services
          </p>
        </div>

        {/* Mobile: search + filter button */}
        <div className="an-fmob" style={{ gap: "8px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="🔍  Search notices..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            style={{
              flex: 1,
              minWidth: 0,
              border: "0.5px solid #ddd",
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "16px",
              outline: "none",
              background: "#fff",
            }}
          />
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: activeFilterCount > 0 ? "#E6F1FB" : "#fff",
              border: `0.5px solid ${activeFilterCount > 0 ? "#B5D4F4" : "#ddd"}`,
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: activeFilterCount > 0 ? "#0C447C" : "#555",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minWidth: "90px",
            }}
          >
            ⚙️ Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: "#0C447C",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active chips (mobile) */}
        {activeChips.length > 0 && (
          <div
            className="an-fmob"
            style={{ gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}
          >
            {activeChips.map(({ key, label, color, bg, border }) => (
              <button
                key={key}
                onClick={() => updateFilters({ [key]: "" })}
                style={{
                  background: bg,
                  border: `0.5px solid ${border}`,
                  color,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {label}{" "}
                <span style={{ opacity: 0.6, fontSize: "13px" }}>×</span>
              </button>
            ))}
            <button
              onClick={() =>
                updateFilters({
                  category: "",
                  state: "",
                  is_free: "",
                  is_urgent: "",
                  ordering: "-listing__is_featured,-listing__created_at",
                })
              }
              style={{
                background: "#FCEBEB",
                border: "0.5px solid #F09595",
                color: "#A32D2D",
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Desktop filters */}
        <div
          className="an-fdesk"
          style={{ gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Search notices..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            style={{
              flex: 1,
              minWidth: "200px",
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 14px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
            }}
          />
          <select
            value={filters.category}
            onChange={(e) => updateFilters({ category: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
              color: "#444",
            }}
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.state}
            onChange={(e) => updateFilters({ state: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
              color: "#444",
            }}
          >
            {STATES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.ordering}
            onChange={(e) => updateFilters({ ordering: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
              color: "#444",
            }}
          >
            <option value="-listing__created_at">Newest first</option>
            <option value="listing__created_at">Oldest first</option>
          </select>
          {[
            { key: "is_free", label: "Free only" },
            { key: "is_urgent", label: "Urgent only" },
          ].map(({ key, label }) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "#444",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={filters[key] === "true"}
                onChange={(e) =>
                  updateFilters({ [key]: e.target.checked ? "true" : "" })
                }
              />
              {label}
            </label>
          ))}
          <SaveSearchButton
            listingType="notice"
            filters={{ search: filters.search, state: filters.state }}
          />
        </div>

        {(isLoading || (isFetching && allResults.length === 0)) && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "8px",
              padding: "14px",
              color: "#A32D2D",
              fontSize: "14px",
            }}
          >
            Failed to load notices. Please try again.
          </div>
        )}
        {!isLoading && !isFetching && allResults.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#888" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📢</div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#555",
                marginBottom: "6px",
              }}
            >
              No notices found
            </p>
            <p style={{ fontSize: "13px" }}>Try a different search or filter</p>
          </div>
        )}

        {/* Mobile list rows */}
        <div
          className="an-mobile"
          style={{ flexDirection: "column", gap: "10px" }}
        >
          {allResults.map((ann) => {
            const catColor =
              CATEGORY_COLORS[ann.category] || CATEGORY_COLORS.general;
            const catEmoji = CATEGORY_EMOJIS[ann.category] || "📢";
            return (
              <Link
                key={ann.id}
                to={`/notices/${ann.listing_slug}`}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e5e5",
                  borderLeft: ann.is_urgent
                    ? "3px solid #A32D2D"
                    : ann.is_featured
                      ? "3px solid #E87722"
                      : "0.5px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  textDecoration: "none",
                  display: "block",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(12,68,124,0.08)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        flexWrap: "wrap",
                        marginBottom: "5px",
                      }}
                    >
                      <span
                        style={{
                          background: catColor.bg,
                          color: catColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        {catEmoji} {ann.category?.replace("_", " ")}
                      </span>
                      {ann.is_urgent && (
                        <span
                          style={{
                            background: "#FCEBEB",
                            color: "#A32D2D",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "8px",
                          }}
                        >
                          🔴 Urgent
                        </span>
                      )}
                      {ann.is_free && (
                        <span
                          style={{
                            background: "#E1F5EE",
                            color: "#085041",
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "8px",
                          }}
                        >
                          Free
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#26215C",
                        marginBottom: "3px",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ann.listing_title}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginBottom: "3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📍 {ann.listing_location}, {ann.listing_state}
                    </p>
                    <p style={{ fontSize: "11px", color: "#aaa" }}>
                      Posted by {ann.posted_by}
                    </p>
                  </div>
                  {(ann.price || ann.is_free) && (
                    <div
                      style={{
                        background: ann.is_free ? "#E1F5EE" : "#FFF1E0",
                        color: ann.is_free ? "#085041" : "#633806",
                        fontSize: "13px",
                        fontWeight: 600,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {ann.price_display}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop card grid */}
        <div
          className="an-desktop"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
        >
          {allResults.map((ann) => (
            <NoticeCard key={ann.id} notice={ann} />
          ))}
        </div>

        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              style={{
                background: "#fff",
                border: "0.5px solid #B5D4F4",
                borderRadius: "8px",
                padding: "10px 28px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#0C447C",
                cursor: isFetching ? "not-allowed" : "pointer",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? "Loading…" : "Load more notices"}
            </button>
            <p style={{ fontSize: "11px", color: "#aaa", marginTop: "8px" }}>
              Showing {allResults.length} of {data.count}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
