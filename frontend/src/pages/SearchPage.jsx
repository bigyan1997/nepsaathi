import { Link, useLocation } from "react-router-dom";
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
    border: "#AFA9EC",
    path: "jobs",
  },
  rooms: {
    emoji: "🏠",
    label: "Rooms",
    color: "#FFF1E0",
    textColor: "#633806",
    border: "#EFD9C0",
    path: "rooms",
  },
  events: {
    emoji: "🎉",
    label: "Events",
    color: "#E1F5EE",
    textColor: "#085041",
    border: "#9FE1CB",
    path: "events",
  },
  notices: {
    emoji: "📢",
    label: "Notices",
    color: "#E6F1FB",
    textColor: "#0C447C",
    border: "#B5D4F4",
    path: "notices",
  },
  businesses: {
    emoji: "🏪",
    label: "Businesses",
    color: "#FFF1E0",
    textColor: "#7A3B00",
    border: "#F0CFA0",
    path: "businesses",
  },
};

export default function SearchPage() {
  const location = useLocation();
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
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "28px",
        background: "#F5F4F0",
        minHeight: "100vh",
      }}
    >
      {/* ── Header banner ── */}
      <div
        style={{
          background: "#26215C",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "14px",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 4px",
          }}
        >
          Search results
        </h1>
        <p style={{ fontSize: "13px", color: "#AFA9EC", margin: 0 }}>
          {isLoading
            ? "Searching..."
            : query
              ? `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"${state ? ` in ${state}` : ""}`
              : "Enter a search term to find listings"}
        </p>
      </div>

      {/* ── No query ── */}
      {!query && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 28px",
            background: "#fff",
            borderRadius: "16px",
            border: "0.5px solid #e5e5e5",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "14px" }}>🔍</div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "6px",
            }}
          >
            What are you looking for?
          </h2>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Enter a search term in the bar above to find listings
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── No results ── */}
      {!isLoading && query && totalResults === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 28px",
            background: "#fff",
            borderRadius: "16px",
            border: "0.5px solid #e5e5e5",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "14px" }}>😕</div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "6px",
            }}
          >
            No results found
          </h2>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Try a different search term or browse by category
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <Link
                key={key}
                to={`/${cfg.path}`}
                style={{
                  background: cfg.color,
                  border: `0.5px solid ${cfg.border}`,
                  color: cfg.textColor,
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: "20px",
                  textDecoration: "none",
                }}
              >
                {cfg.emoji} {cfg.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Results by category ── */}
      {!isLoading &&
        data &&
        Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const results = data[key] || [];
          if (results.length === 0) return null;

          return (
            <div key={key} style={{ marginBottom: "14px" }}>
              {/* Section header — coloured bar */}
              <div
                style={{
                  background: config.color,
                  border: `0.5px solid ${config.border}`,
                  borderRadius: "12px 12px 0 0",
                  padding: "12px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: config.textColor,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{config.emoji}</span>
                  {config.label}
                  <span
                    style={{
                      background: "#fff",
                      color: config.textColor,
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "20px",
                    }}
                  >
                    {results.length}
                  </span>
                </h2>
                <Link
                  to={`/${config.path}?search=${encodeURIComponent(query)}${state ? `&state=${state}` : ""}`}
                  style={{
                    fontSize: "12px",
                    color: config.textColor,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  View all →
                </Link>
              </div>

              {/* Result rows */}
              <div
                style={{
                  background: "#fff",
                  border: `0.5px solid ${config.border}`,
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  overflow: "hidden",
                }}
              >
                {results.map((item, i) => (
                  <Link
                    key={item.id}
                    to={`/${config.path}/${item.listing_slug}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 20px",
                      textDecoration: "none",
                      borderTop: i > 0 ? "0.5px solid #f5f5f5" : "none",
                      borderLeft: `3px solid ${config.border}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5F4F0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
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
                          borderRadius: "9px",
                          background: config.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
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
