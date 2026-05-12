import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../../api/rooms";
import { SkeletonRoomCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";
import SaveSearchButton from "../../components/ui/SaveSearchButton";

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

const SORT_OPTIONS = [
  {
    value: "-listing__is_featured,-listing__created_at",
    label: "Featured first",
  },
  { value: "-listing__created_at", label: "Newest first" },
  { value: "listing__created_at", label: "Oldest first" },
  { value: "price", label: "Price ↑" },
  { value: "-price", label: "Price ↓" },
];

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
                room_type: "",
                state: "",
                min_price: "",
                max_price: "",
                min_bedrooms: "",
                bills_included: "",
                nepalese_household: "",
                pets_allowed: "",
                parking_available: "",
                ordering: "-listing__is_featured,-listing__created_at",
              }))
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#534AB7",
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
            <div style={lbl}>Room type</div>
            <select
              value={draft.room_type}
              onChange={(e) => set("room_type", e.target.value)}
              style={sel}
            >
              {ROOM_TYPES.map(({ value, label }) => (
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
          <div>
            <div style={lbl}>Price range ($/wk)</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <input
                type="number"
                placeholder="Min $"
                value={draft.min_price}
                onChange={(e) => set("min_price", e.target.value)}
                style={{ ...sel, width: "100%", minWidth: 0 }}
              />
              <input
                type="number"
                placeholder="Max $"
                value={draft.max_price}
                onChange={(e) => set("max_price", e.target.value)}
                style={{ ...sel, width: "100%", minWidth: 0 }}
              />
            </div>
          </div>
          <div>
            <div style={lbl}>Min bedrooms</div>
            <select
              value={draft.min_bedrooms}
              onChange={(e) => set("min_bedrooms", e.target.value)}
              style={sel}
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>{n}+</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              {
                key: "bills_included",
                label: "💡 Bills included",
                sub: "Electricity, water, internet",
                color: "#1D9E75",
                bg: "#E1F5EE",
                border: "#9FE1CB",
              },
              {
                key: "nepalese_household",
                label: "🇳🇵 Nepalese household",
                sub: "Nepalese family home",
                color: "#534AB7",
                bg: "#EEEDFE",
                border: "#AFA9EC",
              },
              {
                key: "pets_allowed",
                label: "🐾 Pets allowed",
                sub: "Pets welcome",
                color: "#85510A",
                bg: "#FFF1E0",
                border: "#EFD9C0",
              },
              {
                key: "parking_available",
                label: "🚗 Parking available",
                sub: "On-site parking included",
                color: "#444",
                bg: "#F5F4F0",
                border: "#D3D1C7",
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
          <div>
            <div style={lbl}>Sort by</div>
            <select
              value={draft.ordering}
              onChange={(e) => set("ordering", e.target.value)}
              style={sel}
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            style={{
              width: "100%",
              background: "#E87722",
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

/* ── Mobile card — Option B style ─────────────────── */
function RoomMobileCard({ room }) {
  const isWanted = room.is_wanted;
  return (
    <Link
      to={`/rooms/${room.listing_slug}`}
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
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,119,34,0.12)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      onTouchStart={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,119,34,0.12)")
      }
      onTouchEnd={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* ── Image / colour strip ── */}
      <div
        style={{
          background: "#FFF1E0",
          height: "130px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
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
              position: "absolute",
              inset: 0,
            }}
          />
        ) : (
          <span style={{ fontSize: "36px" }}>{isWanted ? "🏘️" : "🏠"}</span>
        )}

        {/* Price pill — top right */}
        <div
          style={{ position: "absolute", top: "8px", right: "8px", zIndex: 2 }}
        >
          <span
            style={{
              background: "rgba(255,255,255,0.95)",
              color: "#633806",
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {isWanted ? `Up to ${room.price_display}` : room.price_display}
          </span>
        </div>

        {/* Badges — bottom left of strip, stacked vertically */}
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
          {room.is_featured && (
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
          {isWanted && (
            <span
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#E87722",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "5px",
                alignSelf: "flex-start",
              }}
            >
              🏘️ Seeker
            </span>
          )}
        </div>

        {/* Orange accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "#E87722",
            opacity: 0.5,
          }}
        />
      </div>

      {/* ── Body ── */}
      <div
        style={{
          padding: "10px 12px 12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div style={{ fontSize: "10px", color: "#E87722", fontWeight: 600 }}>
          {timeAgo(room.created_at || room.date_posted)}
        </div>
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
          {room.listing_title}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#777",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📍 {room.listing_location}, {room.listing_state}
        </div>
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
        >
          {room.room_type && (
            <span
              style={{
                background: "#FFF1E0",
                color: "#633806",
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "6px",
              }}
            >
              {room.room_type.replace("_", " ")}
            </span>
          )}
          {room.bills_included && (
            <span
              style={{
                background: "#E1F5EE",
                color: "#085041",
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "6px",
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
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "6px",
              }}
            >
              🇳🇵
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Desktop card ─────────────────────────────────── */
function RoomCard({ room }) {
  const [hovered, setHovered] = useState(false);
  const isWanted = room.is_wanted;
  return (
    <Link
      to={`/rooms/${room.listing_slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: `0.5px solid ${hovered ? "#EFD9C0" : "#e5e5e5"}`,
        boxShadow: hovered
          ? "0 8px 28px rgba(232,119,34,0.13)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.2s",
        minHeight: "300px",
      }}
    >
      <div
        style={{
          background: "#FFF1E0",
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
        {room.images?.[0]?.url ? (
          <img
            src={room.images[0].url}
            alt={room.listing_title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              inset: 0,
            }}
          />
        ) : isWanted ? (
          "🏘️"
        ) : (
          "🏠"
        )}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "4px",
            zIndex: 1,
          }}
        >
          {room.is_featured && (
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
          {isWanted && (
            <span
              style={{
                background: "#FFF1E0",
                color: "#E87722",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
              }}
            >
              🏘️ SEEKING
            </span>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1,
          }}
        >
          <span
            style={{
              background: "#FFF1E0",
              color: "#633806",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            {isWanted ? `Up to ${room.price_display}` : room.price_display}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "#E87722",
            opacity: 0.35,
          }}
        />
      </div>
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#E87722" }}>
          {timeAgo(room.created_at || room.date_posted)}
        </div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {room.listing_title}
        </div>
        <div style={{ fontSize: "12px", color: "#777" }}>
          📍 {room.listing_location}, {room.listing_state}
        </div>
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            marginTop: "4px",
          }}
        >
          {room.room_type && (
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
              {room.room_type.replace("_", " ")}
            </span>
          )}
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
              🇳🇵 Nepalese
            </span>
          )}
        </div>
        {room.description && (
          <div
            style={{
              fontSize: "12px",
              color: "#555",
              lineHeight: 1.5,
              marginTop: "4px",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {room.description}
          </div>
        )}
      </div>
      <div
        style={{
          background: "#E87722",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {[
          { value: room.room_type?.replace("_", " ") || "—", label: "Type" },
          { value: room.listing_state || "—", label: "State" },
          {
            value: room.nepalese_household ? "🇳🇵 Yes" : "No",
            label: "Nepali home",
          },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1 }}>
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
export default function RoomsPage() {
  usePageTitle("Rooms for Rent");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState({
    room_type: "",
    search: "",
    bills_included: "",
    nepalese_household: "",
    pets_allowed: "",
    parking_available: "",
    state: "",
    min_price: "",
    max_price: "",
    min_bedrooms: "",
    ordering: "-listing__is_featured,-listing__created_at",
  });
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const prevKey = useRef(null);

  const updateFilters = (u) => {
    setPage(1);
    setFilters((p) => ({ ...p, ...u }));
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["rooms", filters, page],
    queryFn: () =>
      getRooms({
        search: filters.search || undefined,
        room_type: filters.room_type || undefined,
        bills_included: filters.bills_included || undefined,
        nepalese_household: filters.nepalese_household || undefined,
        pets_allowed: filters.pets_allowed || undefined,
        parking_available: filters.parking_available || undefined,
        listing__state: filters.state || undefined,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
        min_bedrooms: filters.min_bedrooms || undefined,
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

  const filteredResults = allResults.filter((r) => {
    if (activeTab === "true") return r.is_wanted === true;
    if (activeTab === "false") return r.is_wanted === false;
    return true;
  });

  const activeFilterCount = [
    filters.room_type,
    filters.state,
    filters.min_price,
    filters.max_price,
    filters.min_bedrooms,
    filters.bills_included,
    filters.nepalese_household,
    filters.pets_allowed,
    filters.parking_available,
    filters.ordering !== "-listing__is_featured,-listing__created_at" ? "1" : "",
  ].filter(Boolean).length;

  const activeChips = [
    filters.room_type && {
      key: "room_type",
      label: ROOM_TYPES.find((t) => t.value === filters.room_type)?.label,
      color: "#633806",
      bg: "#FFF1E0",
      border: "#EFD9C0",
    },
    filters.state && {
      key: "state",
      label: filters.state,
      color: "#3C3489",
      bg: "#EEEDFE",
      border: "#AFA9EC",
    },
    filters.bills_included && {
      key: "bills_included",
      label: "Bills incl.",
      color: "#085041",
      bg: "#E1F5EE",
      border: "#9FE1CB",
    },
    filters.nepalese_household && {
      key: "nepalese_household",
      label: "🇳🇵 Nepalese",
      color: "#3C3489",
      bg: "#EEEDFE",
      border: "#AFA9EC",
    },
    filters.min_price && {
      key: "min_price",
      label: `Min $${filters.min_price}`,
      color: "#633806",
      bg: "#FFF1E0",
      border: "#EFD9C0",
    },
    filters.max_price && {
      key: "max_price",
      label: `Max $${filters.max_price}`,
      color: "#633806",
      bg: "#FFF1E0",
      border: "#EFD9C0",
    },
  ].filter(Boolean);

  const moreFilterCount = ["bills_included", "nepalese_household", "pets_allowed", "parking_available"]
    .filter((k) => filters[k] === "true").length;

  return (
    <>
      <style>{`
        .rm-desktop { display: none !important; }
        .rm-mobile  { display: grid !important; }
        .rm-fdesk   { display: none !important; }
        .rm-fmob    { display: flex !important; }
        .rm-tabs::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .rm-mobile { display: none !important; }
          .rm-desktop{ display: grid !important; }
          .rm-fmob   { display: none !important; }
          .rm-fdesk  { display: flex !important; }
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
        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <h1
            style={{
              fontSize: "24px",
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

        {/* Tabs */}
        <div
          className="rm-tabs"
          style={{
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
            {TABS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => {
                  setActiveTab(value);
                  setPage(1);
                }}
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
                  whiteSpace: "nowrap",
                }}
              >
                <span>{emoji}</span>
                {label}
                {data && (
                  <span
                    style={{
                      background:
                        activeTab === value
                          ? "rgba(255,255,255,0.25)"
                          : "#FFF1E0",
                      color: activeTab === value ? "#fff" : "#E87722",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {value === ""
                      ? (data?.count ?? allResults.length)
                      : value === "true"
                        ? allResults.filter((r) => r.is_wanted).length
                        : allResults.filter((r) => !r.is_wanted).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: search + filter button */}
        <div className="rm-fmob" style={{ gap: "8px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="🔍  Search rooms..."
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
              background: activeFilterCount > 0 ? "#EEEDFE" : "#fff",
              border: `0.5px solid ${activeFilterCount > 0 ? "#AFA9EC" : "#ddd"}`,
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: activeFilterCount > 0 ? "#534AB7" : "#555",
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
                  background: "#534AB7",
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

        {/* Active chips (mobile) */}
        {activeChips.length > 0 && (
          <div
            className="rm-fmob"
            style={{ gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}
          >
            {activeChips.map(({ key, label, color, bg, border }) => (
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
            <button
              onClick={() =>
                updateFilters({
                  room_type: "",
                  state: "",
                  min_price: "",
                  max_price: "",
                  bills_included: "",
                  nepalese_household: "",
                  ordering: "-listing__is_featured,-listing__created_at",
                })
              }
              style={{
                background: "#FCEBEB",
                border: "0.5px solid #F09595",
                color: "#A32D2D",
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Mobile: result count + save search */}
        <div
          className="rm-fmob"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#888" }}>
            {data?.count != null
              ? `${data.count} listing${data.count !== 1 ? "s" : ""} found`
              : ""}
          </span>
          <SaveSearchButton
            listingType="room"
            filters={{ search: filters.search, state: filters.state }}
          />
        </div>

        {/* Desktop filters */}
        <div
          className="rm-fdesk"
          style={{ gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="🔍  Search rooms..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
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
            onChange={(e) => updateFilters({ room_type: e.target.value })}
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
            onChange={(e) => updateFilters({ state: e.target.value })}
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
            onChange={(e) => updateFilters({ min_price: e.target.value })}
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
            onChange={(e) => updateFilters({ max_price: e.target.value })}
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
          <select
            value={filters.min_bedrooms}
            onChange={(e) => updateFilters({ min_bedrooms: e.target.value })}
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
            <option value="">Any beds</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>{n}+ beds</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            style={{
              border: `0.5px solid ${showMoreFilters ? "#AFA9EC" : "#ddd"}`,
              borderRadius: "8px",
              padding: "9px 14px",
              fontSize: "13px",
              background: showMoreFilters ? "#EEEDFE" : "#fff",
              color: showMoreFilters ? "#534AB7" : "#555",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {showMoreFilters ? "Fewer filters ▲" : "More filters ▼"}
            {moreFilterCount > 0 && !showMoreFilters && (
              <span style={{ background: "#534AB7", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 600 }}>
                {moreFilterCount}
              </span>
            )}
          </button>
          <select
            value={filters.ordering}
            onChange={(e) => updateFilters({ ordering: e.target.value })}
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
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <SaveSearchButton
            listingType="room"
            filters={{ search: filters.search, state: filters.state }}
          />
        </div>
        {showMoreFilters && (
          <div
            className="rm-fdesk"
            style={{
              background: "#f9f9ff",
              border: "0.5px solid #e8e6f8",
              borderRadius: "10px",
              padding: "12px 16px",
              gap: "20px",
              marginBottom: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {[
              { key: "bills_included", label: "💡 Bills included" },
              { key: "nepalese_household", label: "🇳🇵 Nepalese household" },
              { key: "pets_allowed", label: "🐾 Pets allowed" },
              { key: "parking_available", label: "🚗 Parking available" },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#444", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={filters[key] === "true"}
                  onChange={(e) => updateFilters({ [key]: e.target.checked ? "true" : "" })}
                />
                {label}
              </label>
            ))}
          </div>
        )}

        {/* Loading */}
        {(isLoading || (isFetching && allResults.length === 0)) && (
          <>
            <div
              className="rm-mobile"
              style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}
            >
              {[1, 2, 3, 4].map((i) => <SkeletonRoomCard key={i} />)}
            </div>
            <div
              className="rm-desktop"
              style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonRoomCard key={i} />)}
            </div>
          </>
        )}

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

        {!isLoading && !isFetching && filteredResults.length === 0 && (
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

        {/* ── Mobile: 2-col card grid (Option B) ── */}
        <div
          className="rm-mobile"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            opacity: isFetching && page === 1 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {filteredResults.map((room) => (
            <RoomMobileCard key={room.id} room={room} />
          ))}
        </div>

        {/* ── Desktop: 3-col card grid ── */}
        <div
          className="rm-desktop"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            opacity: isFetching && page === 1 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {filteredResults.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {/* Load more */}
        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "24px" }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              style={{
                background: "#fff",
                border: "0.5px solid #EFD9C0",
                borderRadius: "8px",
                padding: "10px 28px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#E87722",
                cursor: isFetching ? "not-allowed" : "pointer",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? "Loading…" : "Load more rooms"}
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
