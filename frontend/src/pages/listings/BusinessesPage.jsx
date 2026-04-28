import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBusinesses } from "../../api/businesses";
import { SkeletonRoomCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";

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

/* ── Desktop card ────────────────────────────────── */
function BusinessCard({ business }) {
  const [hovered, setHovered] = useState(false);
  const catColor = CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;
  const catEmoji = CATEGORY_EMOJIS[business.category] || "📌";
  const footerBg = "#8B5E00";

  return (
    <Link
      to={`/businesses/${business.id}`}
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
      {/* Header strip */}
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
        {/* Logo image if available, else emoji */}
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

        {/* Verified badge top-right */}
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

        {/* Featured badge top-left */}
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
            background: footerBg,
            opacity: 0.3,
          }}
        />
      </div>

      {/* Body */}
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {/* Category tag */}
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

        {/* Business name */}
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

        {/* Rating */}
        {business.avg_rating > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {/* Stars */}
            <div style={{ display: "flex", gap: "1px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: "12px",
                    color:
                      star <= Math.round(business.avg_rating)
                        ? "#E87722"
                        : "#ddd",
                    lineHeight: 1,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
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
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
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

        {/* Location */}
        <div style={{ fontSize: "12px", color: "#777" }}>
          📍 {business.suburb}, {business.state}
        </div>

        {/* Description */}
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

        {/* Nepalese owned */}
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

      {/* Footer */}
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

/* ══════════════════════════════════════════════════ */
export default function BusinessesPage() {
  usePageTitle("Nepalese Businesses");
  const location = useLocation();
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

  const updateFilters = (update) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...update }));
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
    } else {
      setAllResults((prev) => [...prev, ...data.results]);
    }
  }, [data]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const stateParam = params.get("state");
    if (searchParam || stateParam) {
      setPage(1);
      setFilters((prev) => ({
        ...prev,
        search: searchParam || "",
        state: stateParam || "",
      }));
    }
  }, [location.search]);

  return (
    <>
      <style>{`
        @media (max-width: 767px)  { .biz-desktop { display: none !important; } .biz-mobile { display: grid !important; } }
        @media (min-width: 768px)  { .biz-mobile  { display: none !important; } .biz-desktop { display: grid !important; } }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "6px",
            }}
          >
            Nepalese businesses
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Find and support Nepalese-owned businesses across Australia
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search businesses..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            style={{
              flex: 1,
              minWidth: "200px",
              border: "0.5px solid #ccc",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
              outline: "none",
              background: "#fff",
            }}
          />
          <select
            value={filters.category}
            onChange={(e) => updateFilters({ category: e.target.value })}
            style={{
              border: "0.5px solid #ccc",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
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
              border: "0.5px solid #ccc",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
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
          <label
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
              checked={filters.is_nepalese_owned === "true"}
              onChange={(e) =>
                updateFilters({
                  is_nepalese_owned: e.target.checked ? "true" : "",
                })
              }
            />
            Nepalese owned
          </label>
          <label
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
              checked={filters.is_verified === "true"}
              onChange={(e) =>
                updateFilters({ is_verified: e.target.checked ? "true" : "" })
              }
            />
            Verified only
          </label>
        </div>

        {/* Loading */}
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

        {/* Error */}
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

        {/* Empty */}
        {data && data.results?.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
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

        {/* ── Mobile: original 2-col grid (compact cards) ── */}
        <div
          className="biz-mobile"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "14px",
          }}
        >
          {allResults.map((business) => {
            const catColor =
              CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;
            const catEmoji = CATEGORY_EMOJIS[business.category] || "📌";
            return (
              <Link
                key={business.id}
                to={`/businesses/${business.id}`}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "18px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  textDecoration: "none",
                  display: "block",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#AFA9EC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e5e5e5")
                }
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: catColor.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    marginBottom: "12px",
                  }}
                >
                  {catEmoji}
                </div>
                <div
                  style={{
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#26215C",
                    }}
                  >
                    {business.business_name}
                  </h3>
                  {business.is_verified && (
                    <span
                      style={{
                        background: "#E1F5EE",
                        color: "#085041",
                        fontSize: "10px",
                        fontWeight: 500,
                        padding: "2px 7px",
                        borderRadius: "8px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      ✓ Verified
                    </span>
                  )}
                </div>
                {/* Rating - mobile */}
                {business.avg_rating > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "6px",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          fontSize: "11px",
                          color:
                            star <= Math.round(business.avg_rating)
                              ? "#E87722"
                              : "#ddd",
                          lineHeight: 1,
                        }}
                      >
                        ★
                      </span>
                    ))}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#E87722",
                      }}
                    >
                      {Number(business.avg_rating).toFixed(1)}
                    </span>
                    <span style={{ fontSize: "11px", color: "#aaa" }}>
                      ({business.review_count})
                    </span>
                  </div>
                )}
                <span
                  style={{
                    background: catColor.bg,
                    color: catColor.color,
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: "8px",
                    display: "inline-block",
                    marginBottom: "8px",
                  }}
                >
                  {catEmoji} {business.category?.replace("_", " ")}
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  📍 {business.suburb}, {business.state}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {business.description}
                </p>
                {business.is_nepalese_owned && (
                  <div style={{ marginTop: "10px" }}>
                    <span
                      style={{
                        background: "#EEEDFE",
                        color: "#3C3489",
                        fontSize: "10px",
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      🇳🇵 Nepalese owned
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Desktop: enhanced card grid ── */}
        <div
          className="biz-desktop"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
        >
          {allResults.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>

        {/* Load more */}
        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "20px" }}>
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
