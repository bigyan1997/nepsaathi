import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getJobs } from "../api/jobs";
import { getRooms } from "../api/rooms";
import { getEvents } from "../api/events";
import ExchangeRates from "../components/ui/ExchangeRates";
import useAuthStore from "../store/authStore";

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

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("all");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    if (searchType === "jobs" || searchType === "all")
      navigate(`/jobs?search=${search}`);
    else if (searchType === "rooms") navigate(`/rooms?search=${search}`);
    else if (searchType === "events") navigate(`/events?search=${search}`);
    else if (searchType === "businesses")
      navigate(`/businesses?search=${search}`);
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

  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .hero-section { padding: 40px 16px 32px !important; }
          .hero-title { font-size: 28px !important; letter-spacing: -0.3px !important; }
          .home-section { padding-left: 16px !important; padding-right: 16px !important; }
          .cta-inner { padding: 24px 20px !important; }
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
              border: "1.5px solid #AFA9EC",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "13px",
                padding: "0 14px",
                color: "#555",
                borderRight: "0.5px solid #e5e5e5",
                minWidth: "100px",
                cursor: "pointer",
              }}
            >
              <option value="all">All</option>
              <option value="jobs">Jobs</option>
              <option value="rooms">Rooms</option>
              <option value="events">Events</option>
              <option value="businesses">Businesses</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, rooms, events..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                padding: "14px 16px",
                color: "#333",
                background: "transparent",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#534AB7",
                color: "#fff",
                border: "none",
                padding: "0 28px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Search
            </button>
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
            { num: "1,240+", label: "Active job listings", color: "#E87722" },
            { num: "830+", label: "Rooms available", color: "#534AB7" },
            { num: "5,600+", label: "Community members", color: "#26215C" },
          ].map(({ num, label, color }) => (
            <div
              key={label}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "center",
                border: "0.5px solid #e5e5e5",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 700, color }}>
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
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {roomsData.results.map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    overflow: "hidden",
                    textDecoration: "none",
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
                      height: "90px",
                      background: "#FFF1E0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                    }}
                  >
                    🏠
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#26215C",
                        }}
                      >
                        {room.listing_title}
                      </div>
                      <div
                        style={{
                          background: "#FFF1E0",
                          color: "#633806",
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                          marginLeft: "8px",
                        }}
                      >
                        {room.price_display}
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#888" }}>
                      📍 {room.listing_location}, {room.listing_state}
                    </div>
                    {room.nepalese_household && (
                      <div
                        style={{
                          marginTop: "8px",
                          display: "inline-block",
                          background: "#EEEDFE",
                          color: "#3C3489",
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        🇳🇵 Nepalese home
                      </div>
                    )}
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
