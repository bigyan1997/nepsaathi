import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../../api/rooms";

const ROOM_TYPES = [
  { value: "", label: "All types" },
  { value: "private", label: "Private room" },
  { value: "shared", label: "Shared room" },
  { value: "entire", label: "Entire property" },
  { value: "studio", label: "Studio" },
];

export default function RoomsPage() {
  const [filters, setFilters] = useState({
    room_type: "",
    search: "",
    bills_included: "",
    nepalese_household: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["rooms", filters],
    queryFn: () =>
      getRooms({
        room_type: filters.room_type || undefined,
        search: filters.search || undefined,
        bills_included: filters.bills_included || undefined,
        nepalese_household: filters.nepalese_household || undefined,
      }),
  });

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
          Room listings
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Find affordable rooms across Australia
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
          placeholder="Search rooms..."
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
          value={filters.room_type}
          onChange={(e) =>
            setFilters({ ...filters, room_type: e.target.value })
          }
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
          {ROOM_TYPES.map(({ value, label }) => (
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
            checked={filters.bills_included === "true"}
            onChange={(e) =>
              setFilters({
                ...filters,
                bills_included: e.target.checked ? "true" : "",
              })
            }
          />
          Bills included
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
          Nepalese household
        </label>
      </div>

      {/* Results */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          Loading rooms...
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
          Failed to load rooms. Please try again.
        </div>
      )}

      {data && data.results?.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          No rooms found. Try a different search.
        </div>
      )}

      {/* Room cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {data?.results?.map((room) => (
          <div
            key={room.id}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#EFD9C0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#e5e5e5")
            }
          >
            {/* Thumb */}
            <div
              style={{
                height: "100px",
                background: "#FFF1E0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
              }}
            >
              🏠
            </div>

            <div style={{ padding: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "6px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#26215C",
                  }}
                >
                  {room.listing_title}
                </h3>
                <span
                  style={{
                    background: "#FFF1E0",
                    color: "#633806",
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "8px",
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {room.price_display}
                </span>
              </div>

              <p
                style={{
                  fontSize: "12px",
                  color: "#888",
                  marginBottom: "10px",
                }}
              >
                {room.listing_location}, {room.listing_state}
              </p>

              {/* Tags */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "#FFF1E0",
                    color: "#633806",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "2px 8px",
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
                      padding: "2px 8px",
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
                      padding: "2px 8px",
                      borderRadius: "8px",
                    }}
                  >
                    🇳🇵 Nepalese home
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
