import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../../api/events";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";

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

export default function EventsPage() {
  usePageTitle("Community Events");
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    is_free: "",
    is_online: "",
    upcoming: "true",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["events", filters],
    queryFn: () =>
      getEvents({
        category: filters.category || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
        is_free: filters.is_free || undefined,
        is_online: filters.is_online || undefined,
        upcoming: filters.upcoming || undefined,
      }),
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          Community events
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Nepalese events, celebrations and meetups across Australia
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
          placeholder="Search events..."
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
            checked={filters.is_free === "true"}
            onChange={(e) =>
              setFilters({
                ...filters,
                is_free: e.target.checked ? "true" : "",
              })
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
            checked={filters.is_online === "true"}
            onChange={(e) =>
              setFilters({
                ...filters,
                is_online: e.target.checked ? "true" : "",
              })
            }
          />
          Online only
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
            checked={filters.upcoming === "true"}
            onChange={(e) =>
              setFilters({
                ...filters,
                upcoming: e.target.checked ? "true" : "",
              })
            }
          />
          Upcoming only
        </label>
      </div>

      {/* Results */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

      {data && data.results?.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          No events found. Try a different search.
        </div>
      )}

      {/* Event cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data?.results?.map((event) => {
          const catColor =
            CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
          const catEmoji = CATEGORY_EMOJIS[event.category] || "📌";
          return (
            <div
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "12px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "border-color 0.15s",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#AFA9EC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e5e5")
              }
            >
              {/* Date box */}
              <div
                style={{
                  background: "#EEEDFE",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  textAlign: "center",
                  minWidth: "60px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#26215C",
                    lineHeight: 1,
                  }}
                >
                  {new Date(event.event_date).getDate()}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#534AB7",
                    fontWeight: 500,
                    marginTop: "2px",
                  }}
                >
                  {new Date(event.event_date)
                    .toLocaleDateString("en-AU", { month: "short" })
                    .toUpperCase()}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "6px",
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
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#26215C",
                    marginBottom: "4px",
                  }}
                >
                  {event.listing_title}
                </h3>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "4px",
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

              {/* Ticket price */}
              <div
                style={{
                  background: event.is_free ? "#E1F5EE" : "#FFF1E0",
                  color: event.is_free ? "#085041" : "#633806",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                  alignSelf: "center",
                }}
              >
                {event.ticket_display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
