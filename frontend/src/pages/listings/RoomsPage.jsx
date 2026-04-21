import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../../api/rooms";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";

const ROOM_TYPES = [
  { value: "", label: "All types" },
  { value: "private", label: "Private room" },
  { value: "shared", label: "Shared room" },
  { value: "entire", label: "Entire property" },
  { value: "studio", label: "Studio" },
];

const TABS = [
  { value: "", label: "All Rooms", emoji: "🏠" },
  { value: "false", label: "Available", emoji: "🏡" },
  { value: "true", label: "Room Seekers", emoji: "🏘️" },
];

export default function RoomsPage() {
  usePageTitle("Rooms for Rent");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");
  const [filters, setFilters] = useState({
    room_type: "",
    search: "",
    bills_included: "",
    nepalese_household: "",
    state: "",
    min_price: "",
    max_price: "",
    ordering: "-listing__created_at",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["rooms", filters],
    queryFn: () =>
      getRooms({
        search: filters.search || undefined,
        room_type: filters.room_type || undefined,
        bills_included: filters.bills_included || undefined,
        nepalese_household: filters.nepalese_household || undefined,
        listing__state: filters.state || undefined,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
        ordering: filters.ordering || undefined,
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

  // Filter by tab on frontend
  const filteredResults = data?.results?.filter((room) => {
    if (activeTab === "") return true;
    if (activeTab === "true") return room.is_wanted === true;
    if (activeTab === "false") return room.is_wanted === false;
    return true;
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#26215C",
            marginBottom: "4px",
          }}
        >
          Room listings
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Find affordable rooms across Australia
        </p>
      </div>

      {/* Tab pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {TABS.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            style={{
              background: activeTab === value ? "#E87722" : "#fff",
              color: activeTab === value ? "#fff" : "#E87722",
              border: `1.5px solid ${activeTab === value ? "#E87722" : "#EFD9C0"}`,
              borderRadius: "20px",
              padding: "7px 18px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{emoji}</span>
            {label}
            {data?.results && (
              <span
                style={{
                  background:
                    activeTab === value ? "rgba(255,255,255,0.25)" : "#FFF1E0",
                  color: activeTab === value ? "#fff" : "#E87722",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "10px",
                }}
              >
                {value === ""
                  ? data.results.length
                  : value === "true"
                    ? data.results.filter((r) => r.is_wanted).length
                    : data.results.filter((r) => !r.is_wanted).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="🔍  Search rooms..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            flex: 1,
            minWidth: "180px",
            border: "0.5px solid #ddd",
            borderRadius: "8px",
            padding: "9px 14px",
            fontSize: "13px",
            outline: "none",
            background: "#fff",
          }}
        />
        <select
          value={filters.room_type}
          onChange={(e) =>
            setFilters({ ...filters, room_type: e.target.value })
          }
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
          {ROOM_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
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
        <input
          type="number"
          placeholder="Min $"
          value={filters.min_price}
          onChange={(e) =>
            setFilters({ ...filters, min_price: e.target.value })
          }
          style={{
            width: "80px",
            border: "0.5px solid #ddd",
            borderRadius: "8px",
            padding: "9px 10px",
            fontSize: "13px",
            outline: "none",
            background: "#fff",
          }}
        />
        <input
          type="number"
          placeholder="Max $"
          value={filters.max_price}
          onChange={(e) =>
            setFilters({ ...filters, max_price: e.target.value })
          }
          style={{
            width: "80px",
            border: "0.5px solid #ddd",
            borderRadius: "8px",
            padding: "9px 10px",
            fontSize: "13px",
            outline: "none",
            background: "#fff",
          }}
        />
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
            checked={filters.bills_included === "true"}
            onChange={(e) =>
              setFilters({
                ...filters,
                bills_included: e.target.checked ? "true" : "",
              })
            }
          />
          Bills incl.
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
            checked={filters.nepalese_household === "true"}
            onChange={(e) =>
              setFilters({
                ...filters,
                nepalese_household: e.target.checked ? "true" : "",
              })
            }
          />
          🇳🇵 Nepalese
        </label>
        <select
          value={filters.ordering}
          onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
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
          <option value="price">Price ↑</option>
          <option value="-price">Price ↓</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
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
            borderRadius: "10px",
            padding: "14px",
            color: "#A32D2D",
            fontSize: "14px",
          }}
        >
          Failed to load rooms. Please try again.
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredResults?.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "48px 20px", color: "#888" }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>
            {activeTab === "true" ? "🏘️" : "🏠"}
          </div>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#555",
              marginBottom: "6px",
            }}
          >
            No rooms found
          </p>
          <p style={{ fontSize: "13px" }}>Try a different search or filter</p>
        </div>
      )}

      {/* Room cards — list style like jobs */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          transition: "opacity 0.2s ease",
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        {filteredResults?.map((room) => (
          <Link
            key={room.id}
            to={`/rooms/listing/${room.listing_id}`}
            style={{
              background: "#fff",
              border: `0.5px solid ${room.is_wanted ? "#EFD9C0" : "#e5e5e5"}`,
              borderRadius: "12px",
              padding: "16px 20px",
              textDecoration: "none",
              display: "block",
              transition: "all 0.15s",
              borderLeft: room.is_wanted
                ? "3px solid #E87722"
                : room.is_featured
                  ? "3px solid #E87722"
                  : "0.5px solid #e5e5e5",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 12px rgba(232,119,34,0.1)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              {/* Left — icon + content */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Icon / thumbnail */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "10px",
                    background: room.images?.[0]?.url
                      ? "transparent"
                      : "#FFF1E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {room.images?.[0]?.url ? (
                    <img
                      src={room.images[0].url}
                      alt={room.listing_title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                  ) : room.is_wanted ? (
                    "🏘️"
                  ) : (
                    "🏠"
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges */}
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      flexWrap: "wrap",
                      marginBottom: "5px",
                    }}
                  >
                    {room.is_featured && (
                      <span
                        style={{
                          background:
                            "linear-gradient(135deg, #E87722, #534AB7)",
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          letterSpacing: "0.03em",
                        }}
                      >
                        ⭐ FEATURED
                      </span>
                    )}
                    {room.is_wanted && (
                      <span
                        style={{
                          background: "#FFF1E0",
                          color: "#E87722",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          letterSpacing: "0.03em",
                        }}
                      >
                        🏘️ LOOKING FOR ROOM
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#26215C",
                      marginBottom: "3px",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {room.listing_title}
                  </h3>

                  {/* Location */}
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#777",
                      marginBottom: "8px",
                    }}
                  >
                    📍 {room.listing_location}, {room.listing_state}
                    {room.is_wanted && room.posted_by && ` · ${room.posted_by}`}
                  </p>

                  {/* Tags */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "#FFF1E0",
                        color: "#633806",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "2px 9px",
                        borderRadius: "8px",
                      }}
                    >
                      {room.room_type?.replace("_", " ")}
                    </span>
                    {room.bills_included && (
                      <span
                        style={{
                          background: "#E1F5EE",
                          color: "#085041",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "2px 9px",
                          borderRadius: "8px",
                        }}
                      >
                        Bills incl.
                      </span>
                    )}
                    {room.nepalese_household && (
                      <span
                        style={{
                          background: "#EEEDFE",
                          color: "#3C3489",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "2px 9px",
                          borderRadius: "8px",
                        }}
                      >
                        🇳🇵 Nepalese
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — price */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div
                  style={{
                    background: "#FFF1E0",
                    color: "#633806",
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {room.is_wanted
                    ? `Up to ${room.price_display}`
                    : room.price_display}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data?.count > 20 && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#aaa",
            fontSize: "12px",
          }}
        >
          Showing {filteredResults?.length} of {data.count} rooms — refine your
          search for better results
        </div>
      )}
    </div>
  );
}
