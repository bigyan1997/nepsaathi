import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { getJobs } from "../api/jobs";
import { getRooms } from "../api/rooms";
import { getEvents } from "../api/events";
import { getStats } from "../api/listings";
import ExchangeRates from "../components/ui/ExchangeRates";
import useAuthStore from "../store/authStore";
import usePageTitle from "../hooks/usePageTitle";
import { getSearchSuggestions } from "../api/listings";

const CATEGORIES = [
  {
    to: "/jobs",
    emoji: "💼",
    label: "Jobs",
    desc: "Find work near you",
    color: "#EEEDFE",
    border: "#AFA9EC",
  },
  {
    to: "/rooms",
    emoji: "🏠",
    label: "Rooms",
    desc: "Affordable rentals",
    color: "#FFF1E0",
    border: "#EFD9C0",
  },
  {
    to: "/events",
    emoji: "🎉",
    label: "Events",
    desc: "Community gatherings",
    color: "#E1F5EE",
    border: "#9FE1CB",
  },
  {
    to: "/announcements",
    emoji: "📢",
    label: "Announcements",
    desc: "News and updates",
    color: "#E6F1FB",
    border: "#B5D4F4",
  },
  {
    to: "/businesses",
    emoji: "🏪",
    label: "Businesses",
    desc: "Nepalese directory",
    color: "#FAEEDA",
    border: "#FAC775",
  },
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

const TYPE_EMOJI = {
  job: "💼",
  room: "🏠",
  event: "🎉",
  announcement: "📢",
  business: "🏪",
};

export default function HomePage() {
  usePageTitle(null); // uses default NepSaathi title
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [state, setState] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (search.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const data = await getSearchSuggestions(search);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim() && !state) return;

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search);
    if (state) params.set("state", state);

    if (searchType === "all") {
      navigate(`/search?${params.toString()}`);
    } else if (searchType === "jobs") {
      navigate(`/jobs?${params.toString()}`);
    } else if (searchType === "rooms") {
      navigate(`/rooms?${params.toString()}`);
    } else if (searchType === "events") {
      navigate(`/events?${params.toString()}`);
    } else if (searchType === "businesses") {
      navigate(`/businesses?${params.toString()}`);
    }
  };

  const { data: jobsData } = useQuery({
    queryKey: ["home-jobs"],
    queryFn: () => getJobs({ page_size: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["home-rooms"],
    queryFn: () => getRooms({ page_size: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["home-events"],
    queryFn: () => getEvents({ upcoming: "true", page_size: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <style>{`
         @media (max-width: 480px) {
            .hero-section { padding: 40px 16px 32px !important; }
            .hero-title { font-size: 28px !important; letter-spacing: -0.3px !important; }
            .home-section { padding-left: 16px !important; padding-right: 16px !important; }
            .cta-inner { padding: 24px 20px !important; }
            .stats-grid { gap: 8px !important; }
            .stat-num { font-size: 18px !important; }
            .search-btn-text { display: none !important; }
        }
        @media (min-width: 481px) {
            .search-btn-text { display: inline !important; }
        }
      `}</style>

      <div style={{ background: "#F5F4F0", minHeight: "100vh" }}>
        {/* ── HERO ── */}
        <div
          className="hero-section"
          style={{
            background: "#FFF1E0",
            borderBottom: "0.5px solid #EFD9C0",
            padding: "60px 28px 48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#EEEDFE",
              border: "0.5px solid #AFA9EC",
              borderRadius: "20px",
              padding: "5px 14px",
              fontSize: "12px",
              color: "#534AB7",
              fontWeight: 500,
              marginBottom: "16px",
              letterSpacing: "0.03em",
            }}
          >
            नेपसाथी · your Nepali friend, wherever you are
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "#26215C",
              maxWidth: "580px",
              margin: "0 auto 16px",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}
          >
            Find <span style={{ color: "#E87722" }}>work</span> and a place to{" "}
            <span style={{ color: "#E87722" }}>call home</span>
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#633806",
              maxWidth: "460px",
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}
          >
            The Nepalese community hub for jobs, rooms, events and businesses
            across Australia.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            style={{
              maxWidth: "600px",
              margin: "0 auto 24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              position: "relative",
              zIndex: 50,
            }}
          >
            {/* Top row — type + search + button */}
            <div
              style={{
                display: "flex",
                border: "1.5px solid #AFA9EC",
                borderRadius: "12px",
                overflow: "visible",
                background: "#fff",
                position: "relative",
              }}
            >
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "16px",
                  padding: "0 8px",
                  color: "#555",
                  borderRight: "0.5px solid #e5e5e5",
                  cursor: "pointer",
                  width: "56px",
                  flexShrink: 0,
                }}
              >
                <option value="all">🔍</option>
                <option value="jobs">💼</option>
                <option value="rooms">🏠</option>
                <option value="events">🎉</option>
                <option value="announcements">📢</option>
                <option value="businesses">🏪</option>
              </select>
              <div style={{ flex: 1, position: "relative" }} ref={searchRef}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() =>
                    suggestions.length > 0 && setShowSuggestions(true)
                  }
                  placeholder={
                    searchType === "all"
                      ? "Search jobs, rooms, events..."
                      : searchType === "jobs"
                        ? "Search jobs..."
                        : searchType === "rooms"
                          ? "Search rooms..."
                          : searchType === "events"
                            ? "Search events..."
                            : searchType === "announcements"
                              ? "Search announcements..."
                              : "Search businesses..."
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    padding: "14px 12px",
                    color: "#333",
                    background: "transparent",
                    boxSizing: "border-box",
                  }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      borderRadius: "12px",
                      border: "0.5px solid #e5e5e5",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      zIndex: 999,
                      overflow: "hidden",
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearch(suggestion.label);
                          const params = new URLSearchParams();
                          params.set("search", suggestion.label);
                          navigate(
                            `/${suggestion.listing_type}s?${params.toString()}`,
                          );
                        }}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          borderBottom:
                            index < suggestions.length - 1
                              ? "0.5px solid #f5f5f5"
                              : "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F5F4F0")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                      >
                        <span style={{ fontSize: "16px" }}>
                          {TYPE_EMOJI[suggestion.listing_type] || "🔍"}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#26215C",
                            }}
                          >
                            {suggestion.label}
                          </div>
                          <div style={{ fontSize: "11px", color: "#888" }}>
                            {suggestion.sublabel}
                          </div>
                        </div>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "11px",
                            color: "#aaa",
                          }}
                        >
                          {suggestion.listing_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  border: "none",
                  padding: "0 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: "0 10px 10px 0",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="search-btn-text">Search</span>
              </button>
            </div>

            {/* Bottom row — state filter */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {STATES.filter((s) => s.value).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setState(state === value ? "" : value)}
                  style={{
                    background:
                      state === value ? "#534AB7" : "rgba(255,255,255,0.8)",
                    color: state === value ? "#fff" : "#534AB7",
                    border: "0.5px solid #AFA9EC",
                    borderRadius: "20px",
                    padding: "4px 14px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </form>

          <ExchangeRates />
        </div>

        {/* ── CATEGORIES ── */}
        <div
          className="home-section"
          style={{
            padding: "36px 28px 0",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {CATEGORIES.map(({ to, emoji, label, desc, color, border }) => (
              <Link
                key={to}
                to={to}
                style={{
                  background: color,
                  border: `0.5px solid ${border}`,
                  borderRadius: "12px",
                  padding: "18px 16px",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <span style={{ fontSize: "24px" }}>{emoji}</span>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#26215C",
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div
          className="home-section stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            padding: "28px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {[
            {
              num: statsData ? `${statsData.total_jobs}+` : "0",
              label: "Active job listings",
              color: "#E87722",
            },
            {
              num: statsData ? `${statsData.total_rooms}+` : "0",
              label: "Rooms available",
              color: "#534AB7",
            },
            {
              num: statsData ? `${statsData.total_members}+` : "0",
              label: "Community members",
              color: "#26215C",
            },
          ].map(({ num, label, color }) => (
            <div
              key={label}
              className="stat-card"
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "center",
                border: "0.5px solid #e5e5e5",
              }}
            >
              <div
                className="stat-num"
                style={{ fontSize: "28px", fontWeight: 700, color }}
              >
                {num}
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── LATEST JOBS ── */}
        {jobsData?.results?.length > 0 && (
          <div
            className="home-section"
            style={{
              padding: "0 28px 32px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{ fontSize: "20px", fontWeight: 600, color: "#26215C" }}
              >
                Latest jobs
              </h2>
              <Link
                to="/jobs"
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {jobsData.results.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    textDecoration: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
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
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#EEEDFE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      💼
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#26215C",
                          marginBottom: "3px",
                        }}
                      >
                        {job.listing_title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {job.company_name} · {job.listing_location},{" "}
                        {job.listing_state}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#EEEDFE",
                      color: "#3C3489",
                      fontSize: "13px",
                      fontWeight: 500,
                      padding: "4px 12px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.salary_display}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── LATEST ROOMS ── */}
        {roomsData?.results?.length > 0 && (
          <div
            className="home-section"
            style={{
              padding: "0 28px 32px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{ fontSize: "20px", fontWeight: 600, color: "#26215C" }}
              >
                Rooms available
              </h2>
              <Link
                to="/rooms"
                style={{
                  fontSize: "13px",
                  color: "#E87722",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                View all →
              </Link>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {roomsData.results.map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    textDecoration: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    transition: "border-color 0.15s",
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
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#FFF1E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      🏠
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#26215C",
                          marginBottom: "3px",
                        }}
                      >
                        {room.listing_title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          📍 {room.listing_location}, {room.listing_state}
                        </span>
                        {room.nepalese_household && (
                          <span>· 🇳🇵 Nepalese home</span>
                        )}
                        {room.room_type && (
                          <span>· {room.room_type.replace("_", " ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#FFF1E0",
                      color: "#633806",
                      fontSize: "13px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {room.price_display}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── UPCOMING EVENTS ── */}
        {eventsData?.results?.length > 0 && (
          <div
            className="home-section"
            style={{
              padding: "0 28px 32px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{ fontSize: "20px", fontWeight: 600, color: "#26215C" }}
              >
                Upcoming events
              </h2>
              <Link
                to="/events"
                style={{
                  fontSize: "13px",
                  color: "#1D9E75",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                View all →
              </Link>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {eventsData.results.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#9FE1CB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e5e5e5")
                  }
                >
                  <div
                    style={{
                      background: "#EEEDFE",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      textAlign: "center",
                      minWidth: "48px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#26215C",
                        lineHeight: 1,
                      }}
                    >
                      {new Date(event.event_date).getDate()}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#534AB7",
                        fontWeight: 500,
                      }}
                    >
                      {new Date(event.event_date)
                        .toLocaleDateString("en-AU", { month: "short" })
                        .toUpperCase()}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#26215C",
                        marginBottom: "3px",
                      }}
                    >
                      {event.listing_title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {event.venue ||
                        `${event.listing_location}, ${event.listing_state}`}
                    </div>
                  </div>
                  <div
                    style={{
                      background: event.is_free ? "#E1F5EE" : "#FFF1E0",
                      color: event.is_free ? "#085041" : "#633806",
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.ticket_display}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA BANNER ── */}
        <div
          className="home-section"
          style={{
            padding: "0 28px 48px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <div
            className="cta-inner"
            style={{
              background: "#26215C",
              borderRadius: "16px",
              padding: "36px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#AFA9EC",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                FREE · ALWAYS
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "8px",
                }}
              >
                Have something to share?
              </h2>
              <p
                style={{ fontSize: "14px", color: "#AFA9EC", lineHeight: 1.6 }}
              >
                Post a job, room, event or announcement — reach thousands of
                Nepalese Australians instantly.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {isAuthenticated ? (
                <Link
                  to="/post-ad"
                  style={{
                    background: "#E87722",
                    color: "#fff",
                    padding: "12px 28px",
                    borderRadius: "9px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  Post a free ad →
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    style={{
                      background: "#E87722",
                      color: "#fff",
                      padding: "12px 28px",
                      borderRadius: "9px",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Join free →
                  </Link>
                  <Link
                    to="/login"
                    style={{
                      background: "transparent",
                      color: "#AFA9EC",
                      padding: "12px 20px",
                      borderRadius: "9px",
                      textDecoration: "none",
                      fontSize: "14px",
                      border: "0.5px solid #534AB7",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
