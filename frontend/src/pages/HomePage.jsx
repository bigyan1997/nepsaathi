import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { getJobs } from "../api/jobs";
import { getRooms } from "../api/rooms";
import { getEvents } from "../api/events";
import { getNotices } from "../api/notices";
import ExchangeRates from "../components/ui/ExchangeRates";
import useAuthStore from "../store/authStore";
import usePageTitle from "../hooks/usePageTitle";
import { getSearchSuggestions, getStats, getFeaturedListings } from "../api/listings";
import DesktopCard from "../components/home/DesktopCard";
import FeaturedCarousel from "../components/home/FeaturedCarousel";
import ListingSection from "../components/home/ListingSection";
import CategoryCards from "../components/home/CategoryCards";
import StatsBar from "../components/home/StatsBar";
import CtaBanner from "../components/home/CtaBanner";
import { timeAgo, HOME_SEARCH_TYPES } from "../components/home/homeUtils";

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

const TYPE_EMOJI = { job: "💼", room: "🏠", event: "🎉", notice: "📢", business: "🏪" };
const SEARCH_TYPES = HOME_SEARCH_TYPES;

const FEATURED_BADGE = (
  <span style={{ background: "linear-gradient(135deg, #E87722, #534AB7)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
    ⭐ FEATURED
  </span>
);

export default function HomePage() {
  usePageTitle(null);
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: featuredData } = useQuery({ queryKey: ["home-featured"], queryFn: getFeaturedListings, staleTime: 1000 * 60 * 5 });
  const { data: jobsData }     = useQuery({ queryKey: ["home-jobs"],     queryFn: () => getJobs({ page_size: 6 }),                   staleTime: 1000 * 60 * 5 });
  const { data: roomsData }    = useQuery({ queryKey: ["home-rooms"],    queryFn: () => getRooms({ page_size: 6 }),                   staleTime: 1000 * 60 * 5 });
  const { data: eventsData }   = useQuery({ queryKey: ["home-events"],   queryFn: () => getEvents({ upcoming: "true", page_size: 6 }), staleTime: 1000 * 60 * 5 });
  const { data: noticesData }  = useQuery({ queryKey: ["home-notices"],  queryFn: () => getNotices({ page_size: 6 }),                 staleTime: 1000 * 60 * 5 });
  const { data: statsData }    = useQuery({ queryKey: ["stats"],         queryFn: getStats,                                           staleTime: 1000 * 60 * 10 });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const data = await getSearchSuggestions(search);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setSuggestionsLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
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
    const routes = { jobs: "/jobs", rooms: "/rooms", events: "/events", notices: "/notices", businesses: "/businesses" };
    navigate(searchType === "all" ? `/search?${params}` : `${routes[searchType]}?${params}`);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (<>{text.slice(0, index)}<span style={{ color: "#534AB7", fontWeight: 700 }}>{text.slice(index, index + query.length)}</span>{text.slice(index + query.length)}</>);
  };

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .listing-desktop { display: none !important; }
          .listing-mobile  { display: flex !important; }
          .hero-section    { padding: 40px 16px 32px !important; }
          .hero-title      { font-size: 28px !important; letter-spacing: -0.3px !important; }
          .home-section    { padding-left: 16px !important; padding-right: 16px !important; }
          .cta-inner       { padding: 24px 20px !important; }
          .stats-grid      { gap: 8px !important; }
          .stat-num        { font-size: 18px !important; }
          .search-btn-text { display: none !important; }
          .feat-scroll     { padding-left: 16px !important; padding-right: 16px !important; }
          .feat-arrows     { display: none !important; }
        }
        @media (min-width: 768px) {
          .listing-mobile  { display: none !important; }
          .listing-desktop { display: grid !important; }
          .search-btn-text { display: inline !important; }
        }
        .feat-scroll                     { display: flex !important; overflow-x: auto; }
        .feat-scroll::-webkit-scrollbar  { display: none; }
        @media (max-width: 480px) { .search-btn-text { display: none !important; } }
        @media (min-width: 481px) and (max-width: 767px) { .search-btn-text { display: inline !important; } }
      `}</style>

      <div style={{ background: "#F5F4F0", minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <div className="hero-section" style={{ background: "#FFF1E0", borderBottom: "0.5px solid #EFD9C0", padding: "60px 28px 48px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", color: "#534AB7", fontWeight: 500, marginBottom: "16px", letterSpacing: "0.03em" }}>
            नेपसाथी · your Nepali friend, wherever you are
          </div>
          <h1 className="hero-title" style={{ fontSize: "42px", fontWeight: 700, color: "#26215C", maxWidth: "580px", margin: "0 auto 16px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            Find <span style={{ color: "#E87722" }}>work</span> and a place to{" "}
            <span style={{ color: "#E87722" }}>call home</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#633806", maxWidth: "460px", margin: "0 auto 32px", lineHeight: 1.7 }}>
            The Nepalese community hub for jobs, rooms, events and businesses across Australia.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto 24px", display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 50 }}>
            <div style={{ display: "flex", border: "1.5px solid #AFA9EC", borderRadius: "12px", overflow: "visible", background: "#fff", position: "relative" }}>
              {/* Type dropdown */}
              <div style={{ position: "relative", flexShrink: 0 }} ref={dropdownRef}>
                <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ border: "none", outline: "none", background: "transparent", padding: "0 10px", height: "100%", borderRight: "0.5px solid #e5e5e5", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "18px", minWidth: "56px" }}>
                  {SEARCH_TYPES.find((t) => t.value === searchType)?.emoji}
                  <span style={{ fontSize: "10px", color: "#aaa" }}>▼</span>
                </button>
                {dropdownOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", borderRadius: "12px", border: "0.5px solid #e5e5e5", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 999, overflow: "hidden", minWidth: "160px" }}>
                    {SEARCH_TYPES.map((type) => (
                      <div key={type.value} onClick={() => { setSearchType(type.value); setDropdownOpen(false); }}
                        style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: searchType === type.value ? "#534AB7" : "#333", fontWeight: searchType === type.value ? 600 : 400, background: searchType === type.value ? "#EEEDFE" : "transparent", transition: "background 0.1s" }}
                        onMouseEnter={(e) => { if (searchType !== type.value) e.currentTarget.style.background = "#F5F4F0"; }}
                        onMouseLeave={(e) => { if (searchType !== type.value) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ fontSize: "16px" }}>{type.emoji}</span>
                        {type.label}
                        {searchType === type.value && <span style={{ marginLeft: "auto", fontSize: "11px" }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input + suggestions */}
              <div style={{ flex: 1, position: "relative" }} ref={searchRef}>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={searchType === "all" ? "Search jobs, rooms, events..." : searchType === "jobs" ? "Search jobs..." : searchType === "rooms" ? "Search rooms..." : searchType === "events" ? "Search events..." : searchType === "notices" ? "Search notices..." : "Search businesses..."}
                  style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", padding: "14px 12px", color: "#333", background: "transparent", boxSizing: "border-box" }} />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", borderRadius: "12px", border: "0.5px solid #e5e5e5", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 999, overflow: "hidden" }}>
                    {suggestions.map((suggestion, index) => (
                      <div key={index}
                        onClick={() => { setShowSuggestions(false); setSearch(suggestion.label); const p = new URLSearchParams(); p.set("search", suggestion.label); navigate(`/${suggestion.listing_type}s?${p}`); }}
                        style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: index < suggestions.length - 1 ? "0.5px solid #f5f5f5" : "none", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F4F0")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                        <span style={{ fontSize: "16px" }}>{TYPE_EMOJI[suggestion.listing_type] || "🔍"}</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#26215C" }}>{highlightMatch(suggestion.label, search)}</div>
                          <div style={{ fontSize: "11px", color: "#888" }}>{suggestion.sublabel}</div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>{suggestion.listing_type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" aria-label="Search listings"
                style={{ background: "#534AB7", color: "#fff", border: "none", padding: "0 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer", borderRadius: "0 10px 10px 0", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <span className="search-btn-text">Search</span>
              </button>
            </div>

            {/* State pills */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              {STATES.filter((s) => s.value).map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setState(state === value ? "" : value)}
                  style={{ background: state === value ? "#534AB7" : "rgba(255,255,255,0.8)", color: state === value ? "#fff" : "#534AB7", border: "0.5px solid #AFA9EC", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}>
                  {label}
                </button>
              ))}
            </div>
          </form>

          <ExchangeRates />
        </div>

        {/* ── CATEGORIES ── */}
        <CategoryCards />

        {/* ── STATS ── */}
        <StatsBar stats={statsData} />

        {/* ── FEATURED POSTS ── */}
        {featuredData?.results?.length > 0 && (
          <FeaturedCarousel listings={featuredData.results.slice(0, 6)} />
        )}

        {/* ── LATEST JOBS ── */}
        <ListingSection
          title="Latest jobs"
          viewAllTo="/jobs"
          viewAllColor="#534AB7"
          items={jobsData?.results?.slice(0, 6)}
          renderRow={(job) => (
            <Link key={job.id} to={`/jobs/${job.listing_slug}`}
              style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "16px 20px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#AFA9EC")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>💼</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {job.listing_title}{job.is_featured && FEATURED_BADGE}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{job.company_name} · {job.listing_location}, {job.listing_state}</div>
                  {job.created_at && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{timeAgo(job.created_at)}</div>}
                </div>
              </div>
              <div style={{ background: "#EEEDFE", color: "#3C3489", fontSize: "13px", fontWeight: 500, padding: "4px 12px", borderRadius: "20px", whiteSpace: "nowrap" }}>{job.salary_display}</div>
            </Link>
          )}
          renderCard={(job) => (
            <DesktopCard key={job.id} to={`/jobs/${job.listing_slug}`} accentType="job" emoji="💼" isFeatured={!!job.is_featured}
              timeStr={timeAgo(job.created_at || job.date_posted)} title={job.listing_title}
              subtitle={`${job.company_name} · ${job.listing_location}, ${job.listing_state}`}
              description={job.description || job.listing_description}
              stats={[{ value: job.salary_display || "—", label: "Salary" }, { value: job.job_type || "—", label: "Type" }, { value: job.listing_state || "—", label: "State" }]} />
          )}
        />

        {/* ── LATEST ROOMS ── */}
        <ListingSection
          title="Rooms available"
          viewAllTo="/rooms"
          viewAllColor="#E87722"
          items={roomsData?.results?.slice(0, 6)}
          renderRow={(room) => (
            <Link key={room.id} to={`/rooms/${room.listing_slug}`}
              style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "16px 20px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#EFD9C0")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#FFF1E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🏠</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {room.listing_title}{room.is_featured && FEATURED_BADGE}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span>📍 {room.listing_location}, {room.listing_state}</span>
                    {room.nepalese_household && <span>· 🇳🇵 Nepalese home</span>}
                    {room.room_type && <span>· {room.room_type.replace("_", " ")}</span>}
                  </div>
                  {room.created_at && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{timeAgo(room.created_at)}</div>}
                </div>
              </div>
              <div style={{ background: "#FFF1E0", color: "#633806", fontSize: "13px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px", whiteSpace: "nowrap" }}>{room.price_display}</div>
            </Link>
          )}
          renderCard={(room) => (
            <DesktopCard key={room.id} to={`/rooms/${room.listing_slug}`} accentType="room" emoji="🏠" isFeatured={!!room.is_featured}
              timeStr={timeAgo(room.created_at || room.date_posted)} title={room.listing_title}
              subtitle={`📍 ${room.listing_location}, ${room.listing_state}`}
              description={room.description || room.listing_description}
              stats={[{ value: room.price_display || "—", label: "Price" }, { value: room.room_type?.replace("_", " ") || "—", label: "Type" }, { value: room.nepalese_household ? "🇳🇵 Yes" : "No", label: "Nepali home" }]} />
          )}
        />

        {/* ── UPCOMING EVENTS ── */}
        <ListingSection
          title="Upcoming events"
          viewAllTo="/events"
          viewAllColor="#1D9E75"
          items={eventsData?.results?.slice(0, 6)}
          renderRow={(event) => (
            <Link key={event.id} to={`/events/${event.listing_slug}`}
              style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "14px 18px", textDecoration: "none", display: "flex", alignItems: "center", gap: "16px", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#9FE1CB")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}>
              <div style={{ background: "#EEEDFE", borderRadius: "10px", padding: "8px 12px", textAlign: "center", minWidth: "48px", flexShrink: 0 }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#26215C", lineHeight: 1 }}>{new Date(event.event_date).getDate()}</div>
                <div style={{ fontSize: "10px", color: "#534AB7", fontWeight: 500 }}>{new Date(event.event_date).toLocaleDateString("en-AU", { month: "short" }).toUpperCase()}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {event.listing_title}{event.is_featured && FEATURED_BADGE}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>{event.venue || `${event.listing_location}, ${event.listing_state}`}</div>
                {event.created_at && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{timeAgo(event.created_at)}</div>}
              </div>
              <div style={{ background: event.is_free ? "#E1F5EE" : "#FFF1E0", color: event.is_free ? "#085041" : "#633806", fontSize: "12px", fontWeight: 500, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>{event.ticket_display}</div>
            </Link>
          )}
          renderCard={(event) => (
            <DesktopCard key={event.id} to={`/events/${event.listing_slug}`} accentType="event" emoji="🎉" isFeatured={!!event.is_featured}
              timeStr={event.event_date ? new Date(event.event_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : ""}
              title={event.listing_title} subtitle={event.venue || `${event.listing_location}, ${event.listing_state}`}
              description={event.description || event.listing_description}
              stats={[{ value: event.ticket_display || "—", label: "Tickets" }, { value: event.is_free ? "Free" : "Paid", label: "Entry" }, { value: event.listing_state || "—", label: "State" }]} />
          )}
        />

        {/* ── LATEST NOTICES ── */}
        <ListingSection
          title="Latest notices"
          viewAllTo="/notices"
          viewAllColor="#0C447C"
          items={noticesData?.results?.slice(0, 6)}
          renderRow={(notice) => (
            <Link key={notice.id} to={`/notices/${notice.listing_slug}`}
              style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "16px 20px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#B5D4F4")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>📢</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {notice.listing_title}{notice.is_featured && FEATURED_BADGE}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>📍 {notice.listing_location}, {notice.listing_state}{notice.category && ` · ${notice.category.replace("_", " ")}`}</div>
                  {notice.created_at && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{timeAgo(notice.created_at)}</div>}
                </div>
              </div>
              <div style={{ background: "#E6F1FB", color: "#0C447C", fontSize: "12px", fontWeight: 500, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                {notice.is_urgent ? "🔴 Urgent" : timeAgo(notice.created_at || notice.date_posted)}
              </div>
            </Link>
          )}
          renderCard={(notice) => (
            <DesktopCard key={notice.id} to={`/notices/${notice.listing_slug}`} accentType="notice" emoji="📢" isFeatured={!!notice.is_featured}
              timeStr={timeAgo(notice.created_at || notice.date_posted)} title={notice.listing_title}
              subtitle={`📍 ${notice.listing_location}, ${notice.listing_state}`}
              description={notice.description || notice.listing_description}
              stats={[{ value: notice.category?.replace("_", " ") || "General", label: "Category" }, { value: notice.listing_state || "—", label: "State" }, { value: notice.posted_by || "—", label: "Posted by" }]} />
          )}
        />

        {/* ── CTA BANNER ── */}
        <CtaBanner isAuthenticated={isAuthenticated} />

      </div>
    </>
  );
}
