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
          Announcements
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Community news, items for sale and services from Nepalese Australians
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
          <option value="event_date">Date: earliest first</option>
          <option value="-event_date">Date: latest first</option>
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
            onChange={(e) => updateFilters({ is_free: e.target.checked ? "true" : "" })}
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
            onChange={(e) => updateFilters({ is_urgent: e.target.checked ? "true" : "" })}
          />
          Urgent only
        </label>
      </div>

      {/* Loading */}
      {(isLoading || (isFetching && allResults.length === 0)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
          No announcements found. Try a different search.
        </div>
      )}

      {/* Announcement cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  {/* Badges */}
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

                {/* Price */}
                {(announcement.price || announcement.is_free) && (
                  <div
                    style={{
                      background: announcement.is_free ? "#E1F5EE" : "#FFF1E0",
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

      {/* Load more */}
      {data?.next && (
        <div style={{ textAlign: "center", paddingTop: "16px" }}>
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
  );
}
