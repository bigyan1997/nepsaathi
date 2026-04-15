import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBusinesses } from "../../api/businesses";
import { SkeletonRoomCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";

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

export default function BusinessesPage() {
  usePageTitle("Nepalese Businesses");
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState({
    category: "",
    state: "",
    search: "",
    is_nepalese_owned: "",
    is_verified: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["businesses", filters],
    queryFn: () =>
      getBusinesses({
        category: filters.category || undefined,
        state: filters.state || undefined,
        search: filters.search || undefined,
        is_nepalese_owned: filters.is_nepalese_owned || undefined,
        is_verified: filters.is_verified || undefined,
      }),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const stateParam = params.get("state");
    if (searchParam || stateParam) {
      setFilters((prev) => ({
        ...prev,
        search: searchParam || "",
        state: stateParam || "",
      }));
    }
  }, [location.search]);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
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
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
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
              setFilters({
                ...filters,
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
              setFilters({
                ...filters,
                is_verified: e.target.checked ? "true" : "",
              })
            }
          />
          Verified only
        </label>
      </div>

      {/* Results */}
      {isLoading && (
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

      {data && data.results?.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          No businesses found. Try a different search.
        </div>
      )}

      {/* Business cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {data?.results?.map((business) => {
          const catColor =
            CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;
          const catEmoji = CATEGORY_EMOJIS[business.category] || "📌";
          return (
            <div
              key={business.id}
              onClick={() => navigate(`/businesses/${business.id}`)}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "12px",
                padding: "18px",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#AFA9EC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e5e5")
              }
            >
              {/* Category icon */}
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

              {/* Name and badges */}
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

              {/* Category */}
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

              {/* Location */}
              <p
                style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}
              >
                📍 {business.suburb}, {business.state}
              </p>

              {/* Description preview */}
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

              {/* Nepalese owned badge */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
