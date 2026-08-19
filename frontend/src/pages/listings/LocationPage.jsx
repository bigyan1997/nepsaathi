import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import usePageMeta from "../../hooks/usePageMeta";
import { LOCATIONS, FEATURED_LOCATIONS, getLocationMeta } from "../../data/locations";
import { getJobs } from "../../api/jobs";
import { getRooms } from "../../api/rooms";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  const w = Math.floor(days / 7);
  return w === 1 ? "1w ago" : `${w}w ago`;
}

function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.listing_slug}`}
      style={{
        display: "block",
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "12px",
        padding: "14px 16px",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#AFA9EC";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(83,74,183,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e5e5";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#26215C", lineHeight: 1.3, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {job.listing_title}
        </span>
        {job.salary_display && (
          <span style={{ background: "#EEEDFE", color: "#3C3489", fontSize: "10px", fontWeight: 600,
            padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {job.salary_display}
          </span>
        )}
      </div>
      {job.company_name && (
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {job.company_name}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#888" }}>
            📍 {job.listing_location}, {job.listing_state}
          </span>
          {job.job_type && (
            <span style={{ background: "#F0EFF9", color: "#534AB7", fontSize: "10px",
              fontWeight: 500, padding: "1px 6px", borderRadius: "5px" }}>
              {job.job_type.replace("_", " ")}
            </span>
          )}
          {job.is_urgent && (
            <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: "10px",
              fontWeight: 600, padding: "1px 6px", borderRadius: "5px" }}>
              🔴 Urgent
            </span>
          )}
        </div>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>
          {timeAgo(job.created_at)}
        </span>
      </div>
    </Link>
  );
}

function RoomCard({ room }) {
  return (
    <Link
      to={`/rooms/${room.listing_slug}`}
      style={{
        display: "block",
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "12px",
        padding: "14px 16px",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#AFA9EC";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(83,74,183,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e5e5";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#26215C", lineHeight: 1.3, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {room.listing_title}
        </span>
        {room.rent_per_week != null && (
          <span style={{ background: "#E6F7F0", color: "#1a7a50", fontSize: "10px", fontWeight: 600,
            padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
            ${room.rent_per_week}/wk
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#888" }}>
            📍 {room.listing_location}, {room.listing_state}
          </span>
          {room.room_type && (
            <span style={{ background: "#F0EFF9", color: "#534AB7", fontSize: "10px",
              fontWeight: 500, padding: "1px 6px", borderRadius: "5px" }}>
              {room.room_type.replace("_", " ")}
            </span>
          )}
        </div>
        <span style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap" }}>
          {timeAgo(room.created_at)}
        </span>
      </div>
    </Link>
  );
}

export default function LocationPage({ listingType }) {
  const { location: locationSlug } = useParams();
  const navigate = useNavigate();
  const loc = LOCATIONS[locationSlug];

  const displayLabel = loc?.label || locationSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const typeVerb = listingType === "job" ? "jobs" : "rooms for rent";
  usePageMeta(
    `Nepali ${listingType === "job" ? "Jobs" : "Rooms"} in ${displayLabel}${loc ? `, ${loc.state}` : ""}`,
    `Find ${typeVerb} in ${displayLabel} posted by the Nepalese community in Australia. Browse Nepali-friendly listings on NepSaathi.`
  );

  const isJob = listingType === "job";
  const typeLabel = isJob ? "Jobs" : "Rooms";
  const typeEmoji = isJob ? "💼" : "🏠";
  const postPath = "/post-ad";
  const browsePath = isJob ? "/jobs" : "/rooms";

  const { data, isLoading, error } = useQuery({
    queryKey: [listingType === "job" ? "jobs-location" : "rooms-location", locationSlug],
    queryFn: () => {
      const params = { search: displayLabel, page_size: 24 };
      return isJob ? getJobs(params) : getRooms(params);
    },
    staleTime: 5 * 60 * 1000,
  });

  const results = data?.results || [];
  const count = data?.count || 0;

  const nearbyLocs = (loc?.nearby || []).filter((s) => LOCATIONS[s]);
  const otherCities = FEATURED_LOCATIONS.filter((s) => s !== locationSlug && LOCATIONS[s]).slice(0, 8);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px 48px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "20px", fontSize: "12px", color: "#aaa" }}>
        <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Home</Link>
        <span>›</span>
        <Link to={browsePath} style={{ color: "#aaa", textDecoration: "none" }}>{typeLabel}</Link>
        <span>›</span>
        <span style={{ color: "#534AB7", fontWeight: 500 }}>{displayLabel}</span>
      </div>

      {/* Hero header */}
      <div style={{
        background: "linear-gradient(135deg, #26215C 0%, #534AB7 100%)",
        borderRadius: "16px",
        padding: "28px 28px 24px",
        marginBottom: "28px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        {loc?.emoji && (
          <div style={{ position: "absolute", top: -20, right: -20, fontSize: "120px", opacity: 0.08, userSelect: "none" }}>
            {loc.emoji}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px" }}>{loc?.emoji || "📍"}</span>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              Nepali {typeLabel} in {displayLabel}
            </h1>
            {loc?.stateLabel && (
              <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "3px" }}>
                {loc.stateLabel}
              </div>
            )}
          </div>
          {!isLoading && count > 0 && (
            <span style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.15)",
              border: "0.5px solid rgba(255,255,255,0.25)",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}>
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
          <Link to={postPath}
            style={{
              background: "#fff",
              color: "#26215C",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}>
            + Post a {isJob ? "job" : "room"} in {displayLabel}
          </Link>
          {loc?.state && (
            <Link to={`${browsePath}?state=${loc.state}`}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                textDecoration: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                border: "0.5px solid rgba(255,255,255,0.3)",
              }}>
              All {loc.state} {typeLabel.toLowerCase()} →
            </Link>
          )}
        </div>
      </div>

      {/* Nearby suburbs (for suburb pages) */}
      {nearbyLocs.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: "8px" }}>
            Also near {displayLabel}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {nearbyLocs.map((slug) => (
              <Link key={slug}
                to={`/${isJob ? "jobs" : "rooms"}/in/${slug}`}
                style={{
                  background: "#F5F4FF",
                  color: "#534AB7",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: "0.5px solid #DDD9F9",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#EEEDFE"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F4FF"; }}
              >
                {typeEmoji} {LOCATIONS[slug].label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Listings grid */}
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#26215C", margin: 0 }}>
          {isLoading ? "Loading listings…" : count > 0 ? `${count} ${typeLabel.toLowerCase()} near ${displayLabel}` : `${typeLabel} in ${displayLabel}`}
        </h2>
        <Link to={browsePath} style={{ fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
          View all →
        </Link>
      </div>

      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ background: "#f5f5f5", borderRadius: "12px", height: "96px",
              animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "10px",
          padding: "14px", color: "#A32D2D", fontSize: "14px" }}>
          Failed to load listings. Please try again.
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "#fafafa",
          borderRadius: "12px", border: "0.5px solid #eee" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>{typeEmoji}</div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>
            No listings in {displayLabel} yet
          </p>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
            Be the first to post a {isJob ? "job" : "room"} in {displayLabel}!
          </p>
          <Link to={postPath}
            style={{ background: "#534AB7", color: "#fff", textDecoration: "none",
              padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 600 }}>
            Post now
          </Link>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {results.map((item) =>
              isJob
                ? <JobCard key={item.id} job={item} />
                : <RoomCard key={item.id} room={item} />
            )}
          </div>
          {data?.next && (
            <div style={{ textAlign: "center" }}>
              <Link to={`${browsePath}?search=${encodeURIComponent(displayLabel)}`}
                style={{ color: "#534AB7", fontSize: "13px", fontWeight: 500, textDecoration: "none",
                  border: "0.5px solid #AFA9EC", borderRadius: "8px", padding: "8px 20px",
                  display: "inline-block" }}>
                See all {count} results →
              </Link>
            </div>
          )}
        </>
      )}

      {/* Browse other cities */}
      <div style={{ marginTop: "48px", background: "#F8F7FF", borderRadius: "14px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#26215C", marginBottom: "14px" }}>
          {typeEmoji} Browse {typeLabel.toLowerCase()} in other cities
        </h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {otherCities.map((slug) => {
            const l = LOCATIONS[slug];
            return (
              <Link key={slug}
                to={`/${isJob ? "jobs" : "rooms"}/in/${slug}`}
                style={{
                  background: "#fff",
                  color: "#444",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "7px 14px",
                  borderRadius: "20px",
                  border: "0.5px solid #e0ddf8",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#EEEDFE";
                  e.currentTarget.style.color = "#26215C";
                  e.currentTarget.style.borderColor = "#AFA9EC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#444";
                  e.currentTarget.style.borderColor = "#e0ddf8";
                }}
              >
                <span>{l.emoji}</span>
                {l.label}
                <span style={{ fontSize: "10px", color: "#aaa", fontWeight: 400 }}>{l.state}</span>
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: "14px" }}>
          <Link to={browsePath}
            style={{ fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
            ← Back to all {typeLabel.toLowerCase()}
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
