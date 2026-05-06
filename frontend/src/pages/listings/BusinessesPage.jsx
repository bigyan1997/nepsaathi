import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBusinesses } from "../../api/businesses";
import { SkeletonRoomCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";
import SaveSearchButton from "../../components/ui/SaveSearchButton";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "restaurant", label: "Restaurant & Cafe" },
  { value: "grocery", label: "Grocery & Food Store" },
  { value: "travel", label: "Travel & Tourism" },
  { value: "beauty", label: "Beauty & Salon" },
  { value: "health", label: "Health & Medical" },
  { value: "legal", label: "Legal & Accounting" },
  { value: "education", label: "Education & Tutoring" },
  { value: "religious", label: "Religious Services" },
  { value: "construction", label: "Construction & Trade" },
  { value: "transport", label: "Transport & Logistics" },
  { value: "finance", label: "Finance & Money Transfer" },
  { value: "freelancer", label: "Freelancer & Pujari" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "other", label: "Other" },
];

const CATEGORY_EMOJIS = {
  restaurant: "🍛",
  grocery: "🛒",
  travel: "✈️",
  beauty: "💇",
  health: "🏥",
  legal: "⚖️",
  education: "📚",
  religious: "🙏",
  construction: "🔨",
  transport: "🚗",
  finance: "💸",
  freelancer: "🧑‍💻",
  retail: "🏪",
  other: "📌",
};

const CATEGORY_COLORS = {
  restaurant: { bg: "#FFF1E0", color: "#633806" },
  grocery: { bg: "#E1F5EE", color: "#085041" },
  travel: { bg: "#E6F1FB", color: "#0C447C" },
  beauty: { bg: "#FBEAF0", color: "#4B1528" },
  health: { bg: "#EAF3DE", color: "#27500A" },
  legal: { bg: "#EEEDFE", color: "#3C3489" },
  education: { bg: "#E6F1FB", color: "#0C447C" },
  religious: { bg: "#FAEEDA", color: "#633806" },
  construction: { bg: "#F1EFE8", color: "#444441" },
  transport: { bg: "#E1F5EE", color: "#085041" },
  finance: { bg: "#EEEDFE", color: "#3C3489" },
  freelancer: { bg: "#FFF1E0", color: "#633806" },
  retail: { bg: "#FAECE7", color: "#4A1B0C" },
  other: { bg: "#F1EFE8", color: "#444441" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins === 1 ? "1 min ago" : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
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
                is_nepalese_owned: "",
                is_verified: "",
              }))
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#633806",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              {
                key: "is_nepalese_owned",
                label: "🇳🇵 Nepalese-owned",
                sub: "Owned by Nepalese people",
                color: "#3C3489",
                bg: "#EEEDFE",
                border: "#AFA9EC",
              },
              {
                key: "is_verified",
                label: "✓ Verified only",
                sub: "Verified by NepSaathi admin",
                color: "#085041",
                bg: "#E1F5EE",
                border: "#9FE1CB",
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
              background: "#8B5E00",
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

/* ── Mobile card — Option B ───────────────────────── */
function BusinessMobileCard({ biz }) {
  const catColor = CATEGORY_COLORS[biz.category] || CATEGORY_COLORS.other;
  const catEmoji = CATEGORY_EMOJIS[biz.category] || "📌";

  return (
    <Link
      to={`/businesses/${biz.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
        textDecoration: "none",
        transition: "box-shadow 0.15s",
        height: "100%",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(139,94,0,0.12)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Strip */}
      <div
        style={{
          background: catColor.bg,
          height: "130px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {biz.logo_url ? (
          <img
            src={biz.logo_url}
            alt={biz.business_name}
            style={{
              width: "64px",
              height: "64px",
              objectFit: "contain",
              borderRadius: "12px",
            }}
          />
        ) : (
          <span style={{ fontSize: "36px" }}>{catEmoji}</span>
        )}

        {/* Verified — top right */}
        {biz.is_verified && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 2,
            }}
          >
            <span
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#085041",
                fontSize: "10px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "20px",
                display: "block",
              }}
            >
              ✓ Verified
            </span>
          </div>
        )}

        {/* Badges — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            zIndex: 2,
          }}
        >
          {biz.is_featured && (
            <span
              style={{
                background: "linear-gradient(135deg,#E87722,#534AB7)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "5px",
                alignSelf: "flex-start",
              }}
            >
              ⭐ Featured
            </span>
          )}
          {biz.is_nepalese_owned && (
            <span
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#3C3489",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "5px",
                alignSelf: "flex-start",
              }}
            >
              🇳🇵 Nepalese
            </span>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "#8B5E00",
            opacity: 0.4,
          }}
        />
      </div>

      {/* Body */}
      <div
        style={{
          padding: "10px 12px 12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {biz.business_name}
        </div>

        {/* Rating */}
        {biz.avg_rating > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "11px",
                  color: s <= Math.round(biz.avg_rating) ? "#E87722" : "#ddd",
                }}
              >
                ★
              </span>
            ))}
            <span
              style={{
                fontSize: "11px",
                color: "#E87722",
                fontWeight: 700,
                marginLeft: "2px",
              }}
            >
              {Number(biz.avg_rating).toFixed(1)}
            </span>
            <span style={{ fontSize: "10px", color: "#bbb" }}>
              ({biz.review_count})
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1px" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} style={{ fontSize: "11px", color: "#ddd" }}>
                ★
              </span>
            ))}
          </div>
        )}

        <span
          style={{
            background: catColor.bg,
            color: catColor.color,
            fontSize: "10px",
            fontWeight: 500,
            padding: "2px 7px",
            borderRadius: "6px",
            alignSelf: "flex-start",
          }}
        >
          {catEmoji} {biz.category?.replace("_", " ")}
        </span>
        <div
          style={{
            fontSize: "11px",
            color: "#777",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📍 {biz.suburb}, {biz.state}
        </div>
        {biz.created_at && (
          <div style={{ fontSize: "10px", color: "#aaa" }}>
            Listed {timeAgo(biz.created_at)}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Desktop card ─────────────────────────────────── */
function BusinessCard({ business }) {
  const [hovered, setHovered] = useState(false);
  const catColor = CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;
  const catEmoji = CATEGORY_EMOJIS[business.category] || "📌";
  return (
    <Link
      to={`/businesses/${business.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: `0.5px solid ${hovered ? "#FAC775" : "#e5e5e5"}`,
        boxShadow: hovered
          ? "0 8px 28px rgba(139,94,0,0.13)"
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
          overflow: "hidden",
        }}
      >
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.business_name}
            style={{
              width: "64px",
              height: "64px",
              objectFit: "contain",
              borderRadius: "12px",
            }}
          />
        ) : (
          catEmoji
        )}
        {business.is_verified && (
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <span
              style={{
                background: "#E1F5EE",
                color: "#085041",
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: "20px",
              }}
            >
              ✓ Verified
            </span>
          </div>
        )}
        {business.is_featured && (
          <div style={{ position: "absolute", top: "10px", left: "10px" }}>
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
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "#8B5E00",
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
          gap: "6px",
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
            alignSelf: "flex-start",
          }}
        >
          {catEmoji} {business.category?.replace("_", " ")}
        </span>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {business.business_name}
        </div>
        {business.avg_rating > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "12px",
                  color:
                    s <= Math.round(business.avg_rating) ? "#E87722" : "#ddd",
                  lineHeight: 1,
                }}
              >
                ★
              </span>
            ))}
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: "#E87722" }}
            >
              {Number(business.avg_rating).toFixed(1)}
            </span>
            <span style={{ fontSize: "11px", color: "#aaa" }}>
              ({business.review_count})
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1px" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                style={{ fontSize: "12px", color: "#ddd", lineHeight: 1 }}
              >
                ★
              </span>
            ))}
            <span
              style={{ fontSize: "11px", color: "#ccc", marginLeft: "4px" }}
            >
              No reviews yet
            </span>
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#777" }}>
          📍 {business.suburb}, {business.state}
        </div>
        {business.description && (
          <div
            style={{
              fontSize: "12px",
              color: "#555",
              lineHeight: 1.5,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {business.description}
          </div>
        )}
        {business.is_nepalese_owned && (
          <span
            style={{
              background: "#EEEDFE",
              color: "#3C3489",
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: "8px",
              alignSelf: "flex-start",
              marginTop: "2px",
            }}
          >
            🇳🇵 Nepalese owned
          </span>
        )}
      </div>
      <div
        style={{
          background: "#8B5E00",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {[
          {
            value:
              business.avg_rating > 0
                ? `★ ${Number(business.avg_rating).toFixed(1)}`
                : "★ —",
            label: `${business.review_count || 0} reviews`,
          },
          { value: business.state || "—", label: "State" },
          {
            value: business.is_nepalese_owned ? "🇳🇵 Yes" : "No",
            label: "Nepali owned",
          },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1 }}>
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
export default function BusinessesPage() {
  usePageTitle("Nepalese Businesses");
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    state: "",
    search: "",
    is_nepalese_owned: "",
    is_verified: "",
  });
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const prevKey = useRef(null);

  const updateFilters = (u) => {
    setPage(1);
    setFilters((p) => ({ ...p, ...u }));
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["businesses", filters, page],
    queryFn: () =>
      getBusinesses({
        category: filters.category || undefined,
        state: filters.state || undefined,
        search: filters.search || undefined,
        is_nepalese_owned: filters.is_nepalese_owned || undefined,
        is_verified: filters.is_verified || undefined,
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
    filters.is_nepalese_owned,
    filters.is_verified,
  ].filter(Boolean).length;

  const activeChips = [
    filters.category && {
      key: "category",
      label: CATEGORIES.find((c) => c.value === filters.category)?.label,
      color: CATEGORY_COLORS[filters.category]?.color || "#633806",
      bg: CATEGORY_COLORS[filters.category]?.bg || "#FFF1E0",
      border: "#EFD9C0",
    },
    filters.state && {
      key: "state",
      label: filters.state,
      color: "#633806",
      bg: "#FFF1E0",
      border: "#EFD9C0",
    },
    filters.is_nepalese_owned && {
      key: "is_nepalese_owned",
      label: "🇳🇵 Nepalese owned",
      color: "#3C3489",
      bg: "#EEEDFE",
      border: "#AFA9EC",
    },
    filters.is_verified && {
      key: "is_verified",
      label: "✓ Verified",
      color: "#085041",
      bg: "#E1F5EE",
      border: "#9FE1CB",
    },
  ].filter(Boolean);

  return (
    <>
      <style>{`
        .bz-desktop { display: none !important; }
        .bz-mobile  { display: grid !important; }
        .bz-fdesk   { display: none !important; }
        .bz-fmob    { display: flex !important; }
        .bz-cats::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .bz-mobile  { display: none !important; }
          .bz-desktop { display: grid !important; }
          .bz-fmob    { display: none !important; }
          .bz-fdesk   { display: flex !important; }
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

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "20px 16px 28px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "4px",
            }}
          >
            Nepalese businesses
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Find and support Nepalese-owned businesses across Australia
          </p>
        </div>

        {/* Mobile: search + filter button */}
        <div className="bz-fmob" style={{ gap: "8px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="🔍  Search businesses..."
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
              background: activeFilterCount > 0 ? "#FFF1E0" : "#fff",
              border: `0.5px solid ${activeFilterCount > 0 ? "#EFD9C0" : "#ddd"}`,
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: activeFilterCount > 0 ? "#633806" : "#555",
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
                  background: "#8B5E00",
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

        {/* Mobile: scrollable category pills */}
        <div
          className="bz-fmob bz-cats"
          style={{
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
            marginBottom: "10px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {[
            { value: "", label: "All", emoji: "🏪" },
            ...CATEGORIES.slice(1).map((c) => ({
              ...c,
              emoji: CATEGORY_EMOJIS[c.value] || "📌",
            })),
          ].map(({ value, label, emoji }) => {
            const active = filters.category === value;
            const col = value ? CATEGORY_COLORS[value] : null;
            return (
              <button
                key={value}
                onClick={() => updateFilters({ category: value })}
                style={{
                  flexShrink: 0,
                  background: active ? col?.bg || "#FFF1E0" : "#fff",
                  border: `1.5px solid ${active ? col?.color || "#8B5E00" : "#e5e5e5"}`,
                  borderRadius: "20px",
                  padding: "6px 13px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  color: active ? col?.color || "#633806" : "#555",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>

        {/* Active non-category chips (mobile) */}
        {activeChips.filter((c) => c.key !== "category").length > 0 && (
          <div
            className="bz-fmob"
            style={{ gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}
          >
            {activeChips
              .filter((c) => c.key !== "category")
              .map(({ key, label, color, bg, border }) => (
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
          </div>
        )}

        {/* Mobile: count + save */}
        <div
          className="bz-fmob"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#888" }}>
            {data?.count != null
              ? `${data.count} business${data.count !== 1 ? "es" : ""} found`
              : ""}
          </span>
          <SaveSearchButton
            listingType="business"
            filters={{
              search: filters.search,
              category: filters.category,
              state: filters.state,
              is_nepalese_owned: filters.is_nepalese_owned,
              is_verified: filters.is_verified,
            }}
          />
        </div>

        {/* Desktop: full filter bar */}
        <div
          className="bz-fdesk"
          style={{ gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Search businesses..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            style={{
              flex: 1,
              minWidth: "200px",
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "10px 14px",
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
              padding: "10px 14px",
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
              padding: "10px 14px",
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
          {[
            { key: "is_nepalese_owned", label: "Nepalese owned" },
            { key: "is_verified", label: "Verified only" },
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
            listingType="business"
            filters={{
              search: filters.search,
              category: filters.category,
              state: filters.state,
              is_nepalese_owned: filters.is_nepalese_owned,
              is_verified: filters.is_verified,
            }}
          />
        </div>

        {(isLoading || (isFetching && allResults.length === 0)) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonRoomCard key={i} />
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
            Failed to load businesses. Please try again.
          </div>
        )}
        {!isLoading && !isFetching && allResults.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#888" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏪</div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#555",
                marginBottom: "6px",
              }}
            >
              No businesses found
            </p>
            <p style={{ fontSize: "13px" }}>Try a different search or filter</p>
          </div>
        )}

        {/* Mobile: 2-col card grid */}
        <div
          className="bz-mobile"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            opacity: isFetching && page === 1 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {allResults.map((biz) => (
            <BusinessMobileCard key={biz.id} biz={biz} />
          ))}
        </div>

        {/* Desktop: 3-col card grid */}
        <div
          className="bz-desktop"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
        >
          {allResults.map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>

        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "24px" }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              style={{
                background: "#fff",
                border: "0.5px solid #FAC775",
                borderRadius: "8px",
                padding: "10px 28px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#633806",
                cursor: isFetching ? "not-allowed" : "pointer",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? "Loading…" : "Load more businesses"}
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
