import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../../api/events";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";
import SaveSearchButton from "../../components/ui/SaveSearchButton";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "food", label: "Food & Dining" },
  { value: "music", label: "Music & Entertainment" },
  { value: "religious", label: "Religious" },
  { value: "community", label: "Community Meetup" },
  { value: "education", label: "Education & Workshop" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS = {
  cultural: { bg: "#EEEDFE", color: "#3C3489" },
  sports: { bg: "#E1F5EE", color: "#085041" },
  food: { bg: "#FFF1E0", color: "#633806" },
  music: { bg: "#FBEAF0", color: "#4B1528" },
  religious: { bg: "#FAEEDA", color: "#633806" },
  community: { bg: "#E6F1FB", color: "#0C447C" },
  education: { bg: "#EAF3DE", color: "#27500A" },
  other: { bg: "#F1EFE8", color: "#444441" },
};

const CATEGORY_EMOJIS = {
  cultural: "🎭",
  sports: "⚽",
  food: "🍛",
  music: "🎵",
  religious: "🙏",
  community: "👥",
  education: "📚",
  other: "📌",
};

const SORT_OPTIONS = [
  { value: "-listing__is_featured,-listing__created_at", label: "Featured first" },
  { value: "-listing__created_at", label: "Newest first" },
  { value: "listing__created_at", label: "Oldest first" },
  { value: "event_date", label: "Date: earliest" },
  { value: "-event_date", label: "Date: latest" },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
                is_online: "",
                ordering: "-listing__is_featured,-listing__created_at",
                upcoming: "true",
              }))
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#1D9E75",
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
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {/* Upcoming toggle */}
          <div>
            <div style={lbl}>Show</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { v: "true", label: "🔜 Upcoming" },
                { v: "", label: "📅 All events" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => set("upcoming", v)}
                  style={{
                    flex: 1,
                    background: draft.upcoming === v ? "#1D9E75" : "#F5F4F0",
                    color: draft.upcoming === v ? "#fff" : "#555",
                    border: "none",
                    borderRadius: "9px",
                    padding: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Checkboxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              {
                key: "is_free",
                label: "🎟️ Free events only",
                sub: "No ticket price",
                color: "#1D9E75",
                bg: "#E1F5EE",
                border: "#9FE1CB",
              },
              {
                key: "is_online",
                label: "💻 Online events only",
                sub: "Virtual / remote events",
                color: "#0C447C",
                bg: "#E6F1FB",
                border: "#B5D4F4",
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
              background: "#1D9E75",
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
function EventCard({ event }) {
  const [hovered, setHovered] = useState(false);
  const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
  const catEmoji = CATEGORY_EMOJIS[event.category] || "📌";
  const footerBg = event.is_free ? "#1D9E75" : "#534AB7";
  return (
    <Link
      to={`/events/${event.listing_slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: `0.5px solid ${hovered ? "#9FE1CB" : "#e5e5e5"}`,
        boxShadow: hovered
          ? "0 8px 28px rgba(29,158,117,0.13)"
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
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#26215C",
              lineHeight: 1,
            }}
          >
            {new Date(event.event_date).getDate()}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: catColor.color,
              fontWeight: 600,
              marginTop: "2px",
            }}
          >
            {new Date(event.event_date)
              .toLocaleDateString("en-AU", { month: "short" })
              .toUpperCase()}{" "}
            {new Date(event.event_date).getFullYear()}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "4px",
          }}
        >
          <span
            style={{
              background: catColor.bg,
              color: catColor.color,
              border: `0.5px solid ${catColor.color}30`,
              fontSize: "9px",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: "6px",
            }}
          >
            {catEmoji} {event.category?.replace("_", " ")}
          </span>
          {event.is_featured && (
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
              ⭐
            </span>
          )}
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
          <span
            style={{
              background: event.is_free ? "#E1F5EE" : "#FFF1E0",
              color: event.is_free ? "#085041" : "#633806",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            {event.ticket_display}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: footerBg,
            opacity: 0.35,
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
        <div style={{ fontSize: "11px", fontWeight: 600, color: footerBg }}>
          {formatDate(event.event_date)} · {formatTime(event.event_date)}
        </div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {event.listing_title}
        </div>
        {event.venue && (
          <div style={{ fontSize: "12px", color: "#777" }}>
            📍 {event.venue}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
        >
          {event.is_free && (
            <span
              style={{
                background: "#E1F5EE",
                color: "#085041",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              Free
            </span>
          )}
          {event.is_online && (
            <span
              style={{
                background: "#E6F1FB",
                color: "#0C447C",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              Online
            </span>
          )}
          {event.listing_state && (
            <span
              style={{
                background: "#F5F4F0",
                color: "#555",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              {event.listing_state}
            </span>
          )}
        </div>
        {event.description && (
          <div
            style={{
              fontSize: "12px",
              color: "#555",
              lineHeight: 1.5,
              marginTop: "4px",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </div>
        )}
      </div>
      <div
        style={{
          background: footerBg,
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {[
          { value: event.ticket_display || "—", label: "Tickets" },
          { value: event.is_free ? "Free" : "Paid", label: "Entry" },
          { value: event.listing_state || "—", label: "State" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1 }}>
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
export default function EventsPage() {
  usePageTitle("Community Events");
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    state: "",
    is_free: "",
    is_online: "",
    upcoming: "true",
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
    queryKey: ["events", filters, page],
    queryFn: () =>
      getEvents({
        category: filters.category || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
        is_free: filters.is_free || undefined,
        is_online: filters.is_online || undefined,
        upcoming: filters.upcoming || undefined,
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
    if (s || st)
      setFilters((p) => ({ ...p, search: s || "", state: st || "" }));
  }, [location.search]);

  const activeFilterCount = [
    filters.category,
    filters.state,
    filters.is_free,
    filters.is_online,
    filters.upcoming !== "true" ? "1" : "",
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
      color: "#085041",
      bg: "#E1F5EE",
      border: "#9FE1CB",
    },
    filters.is_free && {
      key: "is_free",
      label: "Free only",
      color: "#085041",
      bg: "#E1F5EE",
      border: "#9FE1CB",
    },
    filters.is_online && {
      key: "is_online",
      label: "Online only",
      color: "#0C447C",
      bg: "#E6F1FB",
      border: "#B5D4F4",
    },
  ].filter(Boolean);

  return (
    <>
      <style>{`
        .ev-desktop { display: none !important; }
        .ev-mobile  { display: flex !important; }
        .ev-fdesk   { display: none !important; }
        .ev-fmob    { display: flex !important; }
        @media (min-width: 768px) {
          .ev-mobile { display: none !important; }
          .ev-desktop{ display: grid !important; }
          .ev-fmob   { display: none !important; }
          .ev-fdesk  { display: flex !important; }
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
            Community events
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Nepalese events, celebrations and meetups across Australia
          </p>
        </div>

        {/* Upcoming toggle — always visible, above filter row */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          {[
            { v: "true", label: "🔜 Upcoming" },
            { v: "", label: "📅 All events" },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => updateFilters({ upcoming: v })}
              style={{
                background: filters.upcoming === v ? "#1D9E75" : "#fff",
                color: filters.upcoming === v ? "#fff" : "#1D9E75",
                border: `1.5px solid ${filters.upcoming === v ? "#1D9E75" : "#9FE1CB"}`,
                borderRadius: "20px",
                padding: "7px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mobile: search + filter button */}
        <div className="ev-fmob" style={{ gap: "8px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="🔍  Search events..."
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
              background: activeFilterCount > 0 ? "#E1F5EE" : "#fff",
              border: `0.5px solid ${activeFilterCount > 0 ? "#9FE1CB" : "#ddd"}`,
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: activeFilterCount > 0 ? "#1D9E75" : "#555",
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
                  background: "#1D9E75",
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
            className="ev-fmob"
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
                  is_online: "",
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
          className="ev-fdesk"
          style={{ gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Search events..."
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
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {[
            { key: "is_free", label: "Free only" },
            { key: "is_online", label: "Online only" },
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
            listingType="event"
            filters={{ search: filters.search, state: filters.state }}
          />
        </div>

        {/* Mobile: results count + save search */}
        <div
          className="ev-fmob"
          style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}
        >
          <span style={{ fontSize: "12px", color: "#888" }}>
            {data?.count != null ? `${data.count} result${data.count !== 1 ? "s" : ""} found` : ""}
          </span>
          <SaveSearchButton
            listingType="event"
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
            Failed to load events. Please try again.
          </div>
        )}
        {!isLoading && !isFetching && allResults.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#888" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎉</div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#555",
                marginBottom: "6px",
              }}
            >
              No events found
            </p>
            <p style={{ fontSize: "13px" }}>Try a different search or filter</p>
          </div>
        )}

        {/* Mobile list rows */}
        <div
          className="ev-mobile"
          style={{ flexDirection: "column", gap: "12px" }}
        >
          {allResults.map((event) => {
            const catColor =
              CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
            const catEmoji = CATEGORY_EMOJIS[event.category] || "📌";
            return (
              <Link
                key={event.id}
                to={`/events/${event.listing_slug}`}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e5e5",
                  borderLeft: event.is_featured
                    ? "3px solid #E87722"
                    : "0.5px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  textDecoration: "none",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(29,158,117,0.1)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                {/* Date block */}
                <div
                  style={{
                    background: catColor.bg,
                    borderRadius: "10px",
                    padding: "10px 12px",
                    textAlign: "center",
                    minWidth: "52px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#26215C",
                      lineHeight: 1,
                    }}
                  >
                    {new Date(event.event_date).getDate()}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: catColor.color,
                      fontWeight: 600,
                      marginTop: "2px",
                    }}
                  >
                    {new Date(event.event_date)
                      .toLocaleDateString("en-AU", { month: "short" })
                      .toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      flexWrap: "wrap",
                      marginBottom: "4px",
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
                      {catEmoji} {event.category?.replace("_", " ")}
                    </span>
                    {event.is_free && (
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
                    {event.is_online && (
                      <span
                        style={{
                          background: "#E6F1FB",
                          color: "#0C447C",
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        Online
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
                    {event.listing_title}
                  </h3>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "2px",
                    }}
                  >
                    {formatDate(event.event_date)} at{" "}
                    {formatTime(event.event_date)}
                  </div>
                  {event.venue && (
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      📍 {event.venue}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: event.is_free ? "#E1F5EE" : "#FFF1E0",
                    color: event.is_free ? "#085041" : "#633806",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    alignSelf: "center",
                  }}
                >
                  {event.ticket_display}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop card grid */}
        <div
          className="ev-desktop"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
        >
          {allResults.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              style={{
                background: "#fff",
                border: "0.5px solid #9FE1CB",
                borderRadius: "8px",
                padding: "10px 28px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#1D9E75",
                cursor: isFetching ? "not-allowed" : "pointer",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? "Loading…" : "Load more events"}
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
