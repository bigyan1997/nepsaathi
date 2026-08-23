import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPinIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import usePageMeta from "../../hooks/usePageMeta";
import { LOCATIONS, FEATURED_LOCATIONS } from "../../data/locations";
import { getJobs } from "../../api/jobs";
import { getRooms } from "../../api/rooms";
import { getEvents } from "../../api/events";
import { getBusinesses } from "../../api/businesses";
import { getAnnouncements } from "../../api/announcements";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  const w = Math.floor(days / 7);
  return w === 1 ? "1w ago" : `${w}w ago`;
}

const cardHover = {
  onMouseEnter: (e) => {
    e.currentTarget.style.borderColor = "#AFA9EC";
    e.currentTarget.style.boxShadow = "0 4px 16px rgba(83,74,183,0.1)";
    e.currentTarget.style.transform = "translateY(-2px)";
  },
  onMouseLeave: (e) => {
    e.currentTarget.style.borderColor = "#e5e5e5";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.transform = "none";
  },
};

const cardStyle = {
  display: "block",
  background: "#fff",
  border: "0.5px solid #e5e5e5",
  borderRadius: "12px",
  padding: "14px 16px",
  textDecoration: "none",
  transition: "all 0.15s",
};

const titleStyle = {
  fontSize: "13px", fontWeight: 700, color: "#26215C", lineHeight: 1.3, flex: 1,
  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
};

function JobCard({ item }) {
  return (
    <Link to={`/jobs/${item.listing_slug}`} style={cardStyle} {...cardHover}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={titleStyle}>{item.listing_title}</span>
        {item.salary_display && (
          <span style={{ background: "#EEEDFE", color: "#3C3489", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {item.salary_display}
          </span>
        )}
      </div>
      {item.company_name && (
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.company_name}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#888", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={11} weight="fill" color="#E87722" />{item.listing_location}, {item.listing_state}</span>
          {item.job_type && <span style={{ background: "#F0EFF9", color: "#534AB7", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "5px" }}>{item.job_type.replace("_", " ")}</span>}
          {item.is_urgent && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "5px" }}><span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#DC2626", marginRight: "4px", verticalAlign: "middle" }} />Urgent</span>}
        </div>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
      </div>
    </Link>
  );
}

function RoomCard({ item }) {
  return (
    <Link to={`/rooms/${item.listing_slug}`} style={cardStyle} {...cardHover}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={titleStyle}>{item.listing_title}</span>
        {item.price_display && (
          <span style={{ background: "#E6F7F0", color: "#1a7a50", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {item.price_display}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#888", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={11} weight="fill" color="#E87722" />{item.listing_location}, {item.listing_state}</span>
          {item.room_type && <span style={{ background: "#F0EFF9", color: "#534AB7", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "5px" }}>{item.room_type.replace("_", " ")}</span>}
        </div>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
      </div>
    </Link>
  );
}

function EventCard({ item }) {
  const dateStr = item.event_date ? new Date(item.event_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : null;
  return (
    <Link to={`/events/${item.listing_slug}`} style={cardStyle} {...cardHover}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={titleStyle}>{item.listing_title}</span>
        {item.is_free
          ? <span style={{ background: "#E6F7F0", color: "#1a7a50", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>Free</span>
          : item.ticket_price && <span style={{ background: "#FFF4E6", color: "#C05621", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>${item.ticket_price}</span>
        }
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#888", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={11} weight="fill" color="#E87722" />{item.listing_location}, {item.listing_state}</span>
          {dateStr && <span style={{ background: "#F0EFF9", color: "#534AB7", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}><CalendarBlankIcon size={10} weight="fill" color="#534AB7" />{dateStr}</span>}
        </div>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
      </div>
    </Link>
  );
}

function NoticeCard({ item }) {
  return (
    <Link to={`/notices/${item.listing_slug}`} style={cardStyle} {...cardHover}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={titleStyle}>{item.listing_title}</span>
        {item.is_urgent && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}><span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#DC2626", marginRight: "4px", verticalAlign: "middle" }} />Urgent</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#888", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={11} weight="fill" color="#E87722" />{item.listing_location}, {item.listing_state}</span>
          {item.category && <span style={{ background: "#F0EFF9", color: "#534AB7", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "5px" }}>{item.category}</span>}
        </div>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
      </div>
    </Link>
  );
}

function BusinessCard({ item }) {
  return (
    <Link to={`/businesses/${item.slug}`} style={cardStyle} {...cardHover}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={titleStyle}>{item.business_name}</span>
        {item.category && <span style={{ background: "#FFF4E6", color: "#C05621", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>{item.category}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <span style={{ fontSize: "11px", color: "#888", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={11} weight="fill" color="#E87722" />{item.suburb || item.city || ""}{item.state ? `, ${item.state}` : ""}</span>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
      </div>
    </Link>
  );
}

// Config per listing type
const TYPE_CONFIG = {
  job:      { label: "Jobs",       emoji: "💼", browsePath: "/jobs",       stateParam: "listing__state", searchParam: "search" },
  room:     { label: "Rooms",      emoji: "🏠", browsePath: "/rooms",      stateParam: "listing__state", searchParam: "search" },
  event:    { label: "Events",     emoji: "🎉", browsePath: "/events",     stateParam: "listing__state", searchParam: "search" },
  notice:   { label: "Notices",    emoji: "📢", browsePath: "/notices",    stateParam: "listing__state", searchParam: "search" },
  business: { label: "Businesses", emoji: "🏢", browsePath: "/businesses", stateParam: "state",          searchParam: "search" },
};

function fetchForType(listingType, params) {
  switch (listingType) {
    case "job":      return getJobs(params);
    case "room":     return getRooms(params);
    case "event":    return getEvents(params);
    case "notice":   return getAnnouncements(params);
    case "business": return getBusinesses(params);
    default:         return Promise.resolve({ results: [], count: 0 });
  }
}

function renderCard(listingType, item) {
  switch (listingType) {
    case "job":      return <JobCard      key={item.id} item={item} />;
    case "room":     return <RoomCard     key={item.id} item={item} />;
    case "event":    return <EventCard    key={item.id} item={item} />;
    case "notice":   return <NoticeCard   key={item.id} item={item} />;
    case "business": return <BusinessCard key={item.id} item={item} />;
    default:         return null;
  }
}

export default function LocationPage({ listingType }) {
  const { location: locationSlug } = useParams();
  const loc = LOCATIONS[locationSlug];
  const cfg = TYPE_CONFIG[listingType] || TYPE_CONFIG.job;

  const displayLabel = loc?.label || locationSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  usePageMeta(
    `${cfg.label} in ${displayLabel}${loc ? `, ${loc.state}` : ""}`,
    `Find ${cfg.label.toLowerCase()} in ${displayLabel} posted by the community in Australia. Browse listings on NepSaathi.`
  );

  const { data, isLoading, error } = useQuery({
    queryKey: [`location-${listingType}`, locationSlug],
    queryFn: () => {
      // City pages: filter by state (catches all suburbs in that state)
      // Suburb/unknown pages: text search by name
      const params = loc?.filterByState
        ? { [cfg.stateParam]: loc.state, page_size: 24 }
        : { [cfg.searchParam]: displayLabel, page_size: 24 };
      return fetchForType(listingType, params);
    },
    staleTime: 5 * 60 * 1000,
  });

  const results = data?.results || [];
  const count = data?.count || 0;

  const nearbyLocs = (loc?.nearby || []).filter((s) => LOCATIONS[s]);
  const otherCities = FEATURED_LOCATIONS.filter((s) => s !== locationSlug && LOCATIONS[s]).slice(0, 8);

  const seeAllLink = loc?.filterByState
    ? `${cfg.browsePath}?state=${loc.state}`
    : `${cfg.browsePath}?search=${encodeURIComponent(displayLabel)}`;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px 48px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "20px", fontSize: "12px", color: "#aaa" }}>
        <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Home</Link>
        <span>›</span>
        <Link to={cfg.browsePath} style={{ color: "#aaa", textDecoration: "none" }}>{cfg.label}</Link>
        <span>›</span>
        <span style={{ color: "#534AB7", fontWeight: 500 }}>{displayLabel}</span>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #26215C 0%, #534AB7 100%)", borderRadius: "16px", padding: "28px 28px 24px", marginBottom: "28px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <MapPinIcon size={28} weight="duotone" color="#E87722" />
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              {cfg.label} in {displayLabel}
            </h1>
            {loc?.stateLabel && <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "3px" }}>{loc.stateLabel}</div>}
          </div>
          {!isLoading && count > 0 && (
            <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.25)", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap" }}>
              {count} active
            </span>
          )}
        </div>
        {loc?.description && (
          <p style={{ fontSize: "13px", opacity: 0.85, lineHeight: 1.6, margin: 0, maxWidth: "620px" }}>
            {loc.description}
          </p>
        )}
        <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
          <Link to="/post-ad" style={{ background: "#fff", color: "#26215C", textDecoration: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}>
            + Post in {displayLabel}
          </Link>
          {loc?.state && (
            <Link to={seeAllLink} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, border: "0.5px solid rgba(255,255,255,0.3)" }}>
              All {loc.state} {cfg.label.toLowerCase()} →
            </Link>
          )}
        </div>
      </div>

      {/* Nearby suburbs */}
      {nearbyLocs.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Also near {displayLabel}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {nearbyLocs.map((slug) => (
              <Link key={slug} to={`/${cfg.browsePath.slice(1)}/in/${slug}`}
                style={{ background: "#F5F4FF", color: "#534AB7", textDecoration: "none", fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "0.5px solid #DDD9F9", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#EEEDFE"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F4FF"; }}
              >
                {cfg.emoji} {LOCATIONS[slug].label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Listings count header */}
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#26215C", margin: 0 }}>
          {isLoading ? `Loading ${cfg.label.toLowerCase()}…` : count > 0 ? `${count} ${cfg.label.toLowerCase()} near ${displayLabel}` : `${cfg.label} in ${displayLabel}`}
        </h2>
        <Link to={cfg.browsePath} style={{ fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
          View all →
        </Link>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ background: "#f5f5f5", borderRadius: "12px", height: "96px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "10px", padding: "14px", color: "#A32D2D", fontSize: "14px" }}>
          Failed to load listings. Please try again.
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "#fafafa", borderRadius: "12px", border: "0.5px solid #eee" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>{cfg.emoji}</div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>
            No {cfg.label.toLowerCase()} in {displayLabel} yet
          </p>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>Be the first to post one!</p>
          <Link to="/post-ad" style={{ background: "#534AB7", color: "#fff", textDecoration: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 600 }}>
            Post now
          </Link>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {results.map((item) => renderCard(listingType, item))}
          </div>
          {data?.next && (
            <div style={{ textAlign: "center" }}>
              <Link to={seeAllLink} style={{ color: "#534AB7", fontSize: "13px", fontWeight: 500, textDecoration: "none", border: "0.5px solid #AFA9EC", borderRadius: "8px", padding: "8px 20px", display: "inline-block" }}>
                See all {count} results →
              </Link>
            </div>
          )}
        </>
      )}

      {/* Browse other cities */}
      <div style={{ marginTop: "48px", background: "#F8F7FF", borderRadius: "14px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#26215C", marginBottom: "14px" }}>
          {cfg.emoji} Browse {cfg.label.toLowerCase()} in other cities
        </h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {otherCities.map((slug) => {
            const l = LOCATIONS[slug];
            return (
              <Link key={slug} to={`/${cfg.browsePath.slice(1)}/in/${slug}`}
                style={{ background: "#fff", color: "#444", textDecoration: "none", fontSize: "13px", fontWeight: 500, padding: "7px 14px", borderRadius: "20px", border: "0.5px solid #e0ddf8", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#EEEDFE"; e.currentTarget.style.color = "#26215C"; e.currentTarget.style.borderColor = "#AFA9EC"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#e0ddf8"; }}
              >
                <span>{l.emoji}</span>
                {l.label}
                <span style={{ fontSize: "10px", color: "#aaa", fontWeight: 400 }}>{l.state}</span>
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: "14px" }}>
          <Link to={cfg.browsePath} style={{ fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
            ← Back to all {cfg.label.toLowerCase()}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
