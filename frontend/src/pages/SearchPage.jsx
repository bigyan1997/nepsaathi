import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { globalSearch } from "../api/listings";
import { SkeletonCard } from "../components/ui/Skeleton";
import usePageTitle from "../hooks/usePageTitle";

const TYPE_CONFIG = {
  jobs: {
    emoji: "💼",
    label: "Jobs",
    color: "#EEEDFE",
    textColor: "#3C3489",
    path: "jobs",
  },
  rooms: {
    emoji: "🏠",
    label: "Rooms",
    color: "#FFF1E0",
    textColor: "#633806",
    path: "rooms",
  },
  events: {
    emoji: "🎉",
    label: "Events",
    color: "#E1F5EE",
    textColor: "#085041",
    path: "events",
  },
  announcements: {
    emoji: "📢",
    label: "Announcements",
    color: "#E6F1FB",
    textColor: "#0C447C",
    path: "announcements",
  },
};

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || params.get("search") || "";
  const state = params.get("state") || "";

  usePageTitle(query ? `Search: ${query}` : "Search");

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", query, state],
    queryFn: () => globalSearch(query, state),
    enabled: query.length >= 2,
  });

  const totalResults = data
    ? Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "6px",
          }}
        >
          Search results
        </h1>
        {query && (
          <p style={{ fontSize: "14px", color: "#888" }}>
            {isLoading
              ? "Searching..."
              : `${totalResults} results for "${query}"`}
            {state && ` in ${state}`}
          </p>
        )}
      </div>

      {/* No query */}
      {!query && (
        <div style={{ textAlign: "center", padding: "48px", color: "#888" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
          <p>Enter a search term to find listings</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && query && totalResults === 0 && (
        <div style={{ textAlign: "center", padding: "48px", color: "#888" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>😕</div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "8px",
            }}
          >
            No results found
          </h3>
          <p style={{ fontSize: "14px" }}>
            Try a different search term or browse by category
          </p>
        </div>
      )}

      {/* Results by category */}
      {!isLoading &&
        data &&
        Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const results = data[key] || [];
          if (results.length === 0) return null;

          return (
            <div key={key} style={{ marginBottom: "32px" }}>
              {/* Section header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#26215C",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{config.emoji}</span>
                  {config.label}
                  <span
                    style={{
                      background: config.color,
                      color: config.textColor,
                      fontSize: "11px",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {results.length}
                  </span>
                </h2>
                <Link
                  to={`/${config.path}?search=${encodeURIComponent(query)}${state ? `&state=${state}` : ""}`}
                  style={{
                    fontSize: "13px",
                    color: "#534AB7",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  View all →
                </Link>
              </div>

              {/* Result cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {results.map((item) => (
                  <Link
                    key={item.id}
                    to={`/${config.path}/listing/${item.listing_id}`}
                    style={{
                      background: "#fff",
                      border: "0.5px solid #e5e5e5",
                      borderRadius: "12px",
                      padding: "14px 18px",
                      textDecoration: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: config.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        {config.emoji}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#26215C",
                            marginBottom: "2px",
                          }}
                        >
                          {item.listing_title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          📍 {item.listing_location}, {item.listing_state}
                          {item.posted_by && ` · ${item.posted_by}`}
                        </div>
                      </div>
                    </div>
                    {/* Price/salary badge */}
                    {(item.salary_display ||
                      item.price_display ||
                      item.ticket_display) && (
                      <div
                        style={{
                          background: config.color,
                          color: config.textColor,
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {item.salary_display ||
                          item.price_display ||
                          item.ticket_display}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
