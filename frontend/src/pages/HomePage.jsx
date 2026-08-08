import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { getJobs } from "../api/jobs";
import { getRooms } from "../api/rooms";
import { getEvents } from "../api/events";
import { getNotices } from "../api/notices";
import ExchangeRates from "../components/ui/ExchangeRates";
import useAuthStore from "../store/authStore";
import usePageMeta from "../hooks/usePageMeta";
import JsonLd from "../components/ui/JsonLd";
import { getSearchSuggestions, getStats, getFeaturedListings } from "../api/listings";
import DesktopCard from "../components/home/DesktopCard";
import NepSaathiLogo from "../components/ui/NepSaathiLogo";
import FeaturedCarousel from "../components/home/FeaturedCarousel";
import ListingSection from "../components/home/ListingSection";
import CategoryCards from "../components/home/CategoryCards";
import StatsBar from "../components/home/StatsBar";
import CtaBanner from "../components/home/CtaBanner";
import { timeAgo, isNew, HOME_SEARCH_TYPES } from "../components/home/homeUtils";
import useT from "../hooks/useT";

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
const NEW_BADGE = (
  <span style={{ background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
    NEW
  </span>
);

export default function HomePage() {
  usePageMeta(null, null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const t = useT();
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

  const { data: featuredData }                     = useQuery({ queryKey: ["home-featured"], queryFn: getFeaturedListings, staleTime: 1000 * 60 * 5 });
  const { data: jobsData,    isLoading: jobsLoading    } = useQuery({ queryKey: ["home-jobs"],     queryFn: () => getJobs({ page_size: 6 }),                    staleTime: 1000 * 60 * 5 });
  const { data: roomsData,   isLoading: roomsLoading   } = useQuery({ queryKey: ["home-rooms"],    queryFn: () => getRooms({ page_size: 6 }),                    staleTime: 1000 * 60 * 5 });
  const { data: eventsData,  isLoading: eventsLoading  } = useQuery({ queryKey: ["home-events"],   queryFn: () => getEvents({ upcoming: "true", page_size: 6 }), staleTime: 1000 * 60 * 5 });
  const { data: noticesData, isLoading: noticesLoading } = useQuery({ queryKey: ["home-notices"],  queryFn: () => getNotices({ page_size: 6 }),                  staleTime: 1000 * 60 * 5 });
  const { data: statsData }                        = useQuery({ queryKey: ["stats"],         queryFn: getStats,                                            staleTime: 1000 * 60 * 10 });

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
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://www.nepsaathi.com/#website",
            "url": "https://www.nepsaathi.com/",
            "name": "NepSaathi",
            "description": "Community platform for Nepalese Australians — jobs, rooms, events and businesses.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": { "@type": "EntryPoint", "urlTemplate": "https://www.nepsaathi.com/search?q={search_term_string}" },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "Organization",
            "@id": "https://www.nepsaathi.com/#organization",
            "name": "NepSaathi",
            "url": "https://www.nepsaathi.com/",
            "logo": { "@type": "ImageObject", "url": "https://www.nepsaathi.com/icon-512.png" },
            "description": "Community platform for Nepalese Australians — jobs, rooms, events and businesses.",
            "areaServed": "AU",
            "inLanguage": "en-AU"
          }
        ]
      }} />
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        @media (max-width: 767px) {
          .listing-desktop { display: none !important; }
          .listing-mobile  { display: flex !important; }
          .hero-section    { padding: 48px 16px 40px !important; }
          .hero-title      { font-size: 30px !important; letter-spacing: -0.5px !important; }
          .home-section    { padding-left: 16px !important; padding-right: 16px !important; }
          .cta-inner       { padding: 24px 20px !important; }
          .stat-num        { font-size: 20px !important; }
          .search-btn-text { display: none !important; }
          .feat-scroll     { padding-left: 16px !important; padding-right: 16px !important; }
          .feat-arrows     { display: none !important; }
        }
        @media (min-width: 768px) {
          .listing-mobile  { display: none !important; }
          .listing-desktop { display: grid !important; }
          .search-btn-text { display: inline !important; }
        }
        .feat-scroll                    { display: flex !important; overflow-x: auto; }
        .feat-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 480px) { .search-btn-text { display: none !important; } }
        @media (min-width: 481px) and (max-width: 767px) { .search-btn-text { display: inline !important; } }

        .hero-content { animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }

        /* Listing card hover */
        .lc { transition: border-color 0.15s ease, box-shadow 0.2s ease, transform 0.15s ease; }
        .lc:hover { transform: translateY(-1px); }
        .lc-job:hover    { border-color: #AFA9EC !important; box-shadow: 0 4px 16px rgba(83,74,183,0.09); }
        .lc-room:hover   { border-color: #EFD9C0 !important; box-shadow: 0 4px 16px rgba(232,119,34,0.09); }
        .lc-event:hover  { border-color: #9FE1CB !important; box-shadow: 0 4px 16px rgba(29,158,117,0.09); }
        .lc-notice:hover { border-color: #B5D4F4 !important; box-shadow: 0 4px 16px rgba(12,68,124,0.09); }

        /* Search focus ring */
        .search-wrap:focus-within { border-color: #534AB7 !important; box-shadow: 0 0 0 3px rgba(83,74,183,0.10) !important; }
        .search-submit { transition: background 0.15s ease; }
        .search-submit:hover { background: #463EA8 !important; }

        /* State pills */
        .state-pill { transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease !important; }
        .state-pill:active { transform: scale(0.94); }

        /* Dropdowns */
        .type-opt  { transition: background 0.1s ease; }
        .sugg-item { transition: background 0.1s ease; }
        .type-opt:hover  { background: #F5F4F0 !important; }
        .sugg-item:hover { background: #F5F4F0 !important; }
      `}</style>

      <div style={{ background: "#F5F4F0", minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <div className="hero-section" style={{ background: "linear-gradient(160deg, #FFF9F2 0%, #FFF1E0 60%, #FEF0DE 100%)", borderBottom: "0.5px solid #EFD9C0", padding: "72px 28px 56px", textAlign: "center" }}>
          <div className="hero-content">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <NepSaathiLogo size={36} animated />
            </div>
            <div style={{ display: "inline-block", background: "#EEEDFE", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", color: "#534AB7", fontWeight: 600, marginBottom: "20px", letterSpacing: "0.04em" }}>
              {t("home.tagline")}
            </div>
            <h1 className="hero-title" style={{ fontSize: "44px", fontWeight: 800, color: "#26215C", maxWidth: "580px", margin: "0 auto 16px", lineHeight: 1.12, letterSpacing: "-0.8px" }}>
              {t("home.hero.headline1")}{" "}
              <span style={{ color: "#E87722" }}>{t("home.hero.headline2")}</span>{" "}
              {t("home.hero.headline3")}{" "}
              <span style={{ color: "#E87722" }}>{t("home.hero.headline4")}</span>
            </h1>
            <p style={{ fontSize: "16px", color: "#7A6148", maxWidth: "440px", margin: "0 auto 36px", lineHeight: 1.65 }}>
              {t("home.hero.subtitle")}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto 28px", display: "flex", flexDirection: "column", gap: "10px", position: "relative", zIndex: 50 }}>
              <div className="search-wrap" style={{ display: "flex", border: "1.5px solid #AFA9EC", borderRadius: "12px", overflow: "visible", background: "#fff", position: "relative", transition: "border-color 0.15s ease, box-shadow 0.15s ease" }}>
                {/* Type dropdown */}
                <div style={{ position: "relative", flexShrink: 0 }} ref={dropdownRef}>
                  <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{ border: "none", outline: "none", background: "transparent", padding: "0 10px", height: "100%", borderRight: "0.5px solid #e5e5e5", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "18px", minWidth: "56px" }}>
                    {SEARCH_TYPES.find((t) => t.value === searchType)?.emoji}
                    <span style={{ fontSize: "10px", color: "#aaa" }}>▼</span>
                  </button>
                  {dropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", borderRadius: "12px", border: "0.5px solid #e8e8e8", boxShadow: "0 8px 28px rgba(0,0,0,0.10)", zIndex: 999, overflow: "hidden", minWidth: "160px" }}>
                      {SEARCH_TYPES.map((type) => (
                        <div key={type.value} className="type-opt" onClick={() => { setSearchType(type.value); setDropdownOpen(false); }}
                          style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: searchType === type.value ? "#534AB7" : "#333", fontWeight: searchType === type.value ? 600 : 400, background: searchType === type.value ? "#EEEDFE" : "transparent" }}>
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
                    placeholder={t(`home.search.placeholder.${searchType === "all" ? "all" : searchType}`)}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", padding: "14px 12px", color: "#333", background: "transparent", boxSizing: "border-box" }} />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: "12px", border: "0.5px solid #e8e8e8", boxShadow: "0 8px 28px rgba(0,0,0,0.10)", zIndex: 999, overflow: "hidden" }}>
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="sugg-item"
                          onClick={() => { setShowSuggestions(false); setSearch(suggestion.label); const p = new URLSearchParams(); p.set("search", suggestion.label); navigate(`/${suggestion.listing_type}s?${p}`); }}
                          style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: index < suggestions.length - 1 ? "0.5px solid #f5f5f5" : "none" }}>
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

                <button type="submit" className="search-submit" aria-label="Search listings"
                  style={{ background: "#534AB7", color: "#fff", border: "none", padding: "0 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer", borderRadius: "0 10px 10px 0", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="search-btn-text">{t("home.search.btn")}</span>
                </button>
              </div>

              {/* State pills */}
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                {STATES.filter((s) => s.value).map(({ value, label }) => (
                  <button key={value} type="button" className="state-pill" onClick={() => setState(state === value ? "" : value)}
                    style={{ background: state === value ? "#534AB7" : "rgba(255,255,255,0.85)", color: state === value ? "#fff" : "#534AB7", border: `0.5px solid ${state === value ? "#534AB7" : "#AFA9EC"}`, borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </form>

            <ExchangeRates />
          </div>
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
          title={t("home.sections.jobs")}
          viewAllTo="/jobs"
          viewAllColor="#534AB7"
          isLoading={jobsLoading}
          items={jobsData?.results?.slice(0, 6)}
          renderRow={(job) => (
            <Link key={job.id} to={`/jobs/${job.listing_slug}`} className="lc lc-job"
              style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "12px", padding: "16px 20px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>💼</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {job.listing_title}{job.is_featured && FEATURED_BADGE}{isNew(job.created_at) && NEW_BADGE}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{job.company_name} · {job.listing_location}, {job.listing_state}</div>
                  {job.created_at && <div style={{ fontSize: "11px", color: "#bbb", marginTop: "2px" }}>{timeAgo(job.created_at)}</div>}
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
          title={t("home.sections.rooms")}
          viewAllTo="/rooms"
          viewAllColor="#E87722"
          isLoading={roomsLoading}
          items={roomsData?.results?.slice(0, 6)}
          renderRow={(room) => (
            <Link key={room.id} to={`/rooms/${room.listing_slug}`} className="lc lc-room"
              style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "12px", padding: "16px 20px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#FFF1E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🏠</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {room.listing_title}{room.is_featured && FEATURED_BADGE}{isNew(room.created_at) && NEW_BADGE}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span>📍 {room.listing_location}, {room.listing_state}</span>
                    {room.nepalese_household && <span>· 🇳🇵 Nepalese home</span>}
                    {room.room_type && <span>· {room.room_type.replace("_", " ")}</span>}
                  </div>
                  {room.created_at && <div style={{ fontSize: "11px", color: "#bbb", marginTop: "2px" }}>{timeAgo(room.created_at)}</div>}
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
          title={t("home.sections.events")}
          viewAllTo="/events"
          viewAllColor="#1D9E75"
          isLoading={eventsLoading}
          items={eventsData?.results?.slice(0, 6)}
          renderRow={(event) => (
            <Link key={event.id} to={`/events/${event.listing_slug}`} className="lc lc-event"
              style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "12px", padding: "14px 18px", textDecoration: "none", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "#EEEDFE", borderRadius: "10px", padding: "8px 12px", textAlign: "center", minWidth: "48px", flexShrink: 0 }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#26215C", lineHeight: 1 }}>{new Date(event.event_date).getDate()}</div>
                <div style={{ fontSize: "10px", color: "#534AB7", fontWeight: 600, letterSpacing: "0.03em" }}>{new Date(event.event_date).toLocaleDateString("en-AU", { month: "short" }).toUpperCase()}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {event.listing_title}{event.is_featured && FEATURED_BADGE}{isNew(event.created_at) && NEW_BADGE}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>{event.venue || `${event.listing_location}, ${event.listing_state}`}</div>
                {event.created_at && <div style={{ fontSize: "11px", color: "#bbb", marginTop: "2px" }}>{timeAgo(event.created_at)}</div>}
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
          title={t("home.sections.notices")}
          viewAllTo="/notices"
          viewAllColor="#0C447C"
          isLoading={noticesLoading}
          items={noticesData?.results?.slice(0, 6)}
          renderRow={(notice) => (
            <Link key={notice.id} to={`/notices/${notice.listing_slug}`} className="lc lc-notice"
              style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "12px", padding: "16px 20px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>📢</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {notice.listing_title}{notice.is_featured && FEATURED_BADGE}{isNew(notice.created_at) && NEW_BADGE}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>📍 {notice.listing_location}, {notice.listing_state}{notice.category && ` · ${notice.category.replace("_", " ")}`}</div>
                  {notice.created_at && <div style={{ fontSize: "11px", color: "#bbb", marginTop: "2px" }}>{timeAgo(notice.created_at)}</div>}
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
