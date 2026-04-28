import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "../../api/announcements";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";

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

/* ── helpers ─────────────────────────────────────── */
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

/* ── Desktop card ────────────────────────────────── */
function AnnouncementCard({ announcement }) {
  const [hovered, setHovered] = useState(false);
  const catColor =
    CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS.general;
  const catEmoji = CATEGORY_EMOJIS[announcement.category] || "📢";
  const footerBg = "#0C447C";

  return (
    <Link
      to={`/announcements/${announcement.id}`}
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
        }}
      >
        {catEmoji}

        {/* Badges top-left */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "4px",
          }}
        >
          {announcement.is_featured && (
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
          {announcement.is_urgent && (
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

        {/* Price badge top-right */}
        {(announcement.price || announcement.is_free) && (
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <span
              style={{
                background: announcement.is_free ? "#E1F5EE" : "#FFF1E0",
                color: announcement.is_free ? "#085041" : "#633806",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              {announcement.price_display}
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
          gap: "5px",
        }}
      >
        {/* Timestamp */}
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#2176AE" }}>
          {timeAgo(announcement.created_at || announcement.date_posted)}
        </div>

        {/* Category + free tags */}
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
            {catEmoji} {announcement.category?.replace("_", " ")}
          </span>
          {announcement.is_free && (
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

        {/* Title */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {announcement.listing_title}
        </div>

        {/* Location */}
        <div style={{ fontSize: "12px", color: "#777" }}>
          📍 {announcement.listing_location}, {announcement.listing_state}
        </div>

        {/* Description */}
        {announcement.description && (
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
            {announcement.description}
          </div>
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
            value: announcement.category?.replace("_", " ") || "—",
            label: "Category",
          },
          { value: announcement.listing_state || "—", label: "State" },
          { value: announcement.posted_by || "—", label: "Posted by" },
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

/* ══════════════════════════════════════════════════ */
export default function AnnouncementsPage() {
  usePageTitle("Announcements");
  const location = useLocation();
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    state: "",
    is_free: "",
    is_urgent: "",
    ordering: "",
  });
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const prevKey = useRef(null);

  const updateFilters = (update) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["announcements", filters, page],
    queryFn: () =>
      getAnnouncements({
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
        @media (max-width: 767px)  { .ann-desktop { display: none !important; } .ann-mobile { display: flex !important; } }
        @media (min-width: 768px)  { .ann-mobile  { display: none !important; } .ann-desktop { display: grid !important; } }
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
            Announcements
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Community news, items for sale and services from Nepalese
            Australians
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
            placeholder="Search announcements..."
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
          <select
            value={filters.ordering}
            onChange={(e) => updateFilters({ ordering: e.target.value })}
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
            <option value="-listing__created_at">Newest first</option>
            <option value="listing__created_at">Oldest first</option>
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
              checked={filters.is_free === "true"}
              onChange={(e) =>
                updateFilters({ is_free: e.target.checked ? "true" : "" })
              }
            />
            Free only
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
              checked={filters.is_urgent === "true"}
              onChange={(e) =>
                updateFilters({ is_urgent: e.target.checked ? "true" : "" })
              }
            />
            Urgent only
          </label>
        </div>

        {/* Loading */}
        {(isLoading || (isFetching && allResults.length === 0)) && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
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
            Failed to load announcements. Please try again.
          </div>
        )}

        {/* Empty */}
        {data && data.results?.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📢</div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#555",
                marginBottom: "6px",
              }}
            >
              No announcements found
            </p>
            <p style={{ fontSize: "13px" }}>Try a different search or filter</p>
          </div>
        )}

        {/* ── Mobile: original list rows ── */}
        <div
          className="ann-mobile"
          style={{ flexDirection: "column", gap: "12px" }}
        >
          {allResults.map((announcement) => {
            const catColor =
              CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS.general;
            return (
              <Link
                key={announcement.id}
                to={`/announcements/${announcement.id}`}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  textDecoration: "none",
                  display: "block",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#EFD9C0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e5e5e5")
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "8px",
                        flexWrap: "wrap",
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
                        {announcement.category?.replace("_", " ")}
                      </span>
                      {announcement.is_urgent && (
                        <span
                          style={{
                            background: "#FCEBEB",
                            color: "#A32D2D",
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "8px",
                          }}
                        >
                          Urgent
                        </span>
                      )}
                      {announcement.is_free && (
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
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#26215C",
                        marginBottom: "4px",
                      }}
                    >
                      {announcement.listing_title}
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        marginBottom: "8px",
                      }}
                    >
                      {announcement.listing_location},{" "}
                      {announcement.listing_state}
                    </p>
                    <p style={{ fontSize: "12px", color: "#aaa" }}>
                      Posted by {announcement.posted_by}
                    </p>
                  </div>
                  {(announcement.price || announcement.is_free) && (
                    <div
                      style={{
                        background: announcement.is_free
                          ? "#E1F5EE"
                          : "#FFF1E0",
                        color: announcement.is_free ? "#085041" : "#633806",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "6px 14px",
                        borderRadius: "20px",
                        whiteSpace: "nowrap",
                        marginLeft: "12px",
                      }}
                    >
                      {announcement.price_display}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Desktop: card grid ── */}
        <div
          className="ann-desktop"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
        >
          {allResults.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
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
              {isFetching ? "Loading…" : "Load more announcements"}
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
