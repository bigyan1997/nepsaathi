import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicProfile } from "../api/auth";
import { getListings } from "../api/listings";
import usePageTitle from "../hooks/usePageTitle";

const TYPE_COLORS = {
  job:    { bg: "#EEEDFE", color: "#3C3489" },
  room:   { bg: "#FFF1E0", color: "#633806" },
  event:  { bg: "#E1F5EE", color: "#085041" },
  notice: { bg: "#E6F1FB", color: "#0C447C" },
};
const TYPE_EMOJIS = { job: "💼", room: "🏠", event: "🎉", notice: "📢" };
const TYPE_PATHS  = { job: "jobs", room: "rooms", event: "events", notice: "notices" };

function Avatar({ profile }) {
  const src = profile.avatar || profile.google_avatar;
  const initials = (profile.full_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={profile.full_name}
        style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }}
      />
    );
  }
  return (
    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#E87722", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "#fff", border: "3px solid rgba(255,255,255,0.3)" }}>
      {initials}
    </div>
  );
}

export default function UserProfilePage() {
  const { id } = useParams();

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: () => getPublicProfile(id),
    retry: false,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["user-listings", id],
    queryFn: () => getListings({ user: id, status: "active", page_size: 20 }),
    enabled: !!profile,
  });

  usePageTitle(profile ? `${profile.full_name} — NepSaathi` : "Member Profile");

  if (profileLoading) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ background: "#26215C", borderRadius: "16px", height: "140px", marginBottom: "16px", animation: "pulse 1.5s infinite" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: "#e5e5e5", borderRadius: "12px", height: "80px", marginBottom: "10px", animation: "pulse 1.5s infinite" }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#26215C", marginBottom: "8px" }}>Member not found</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>This profile doesn't exist or has been removed.</p>
        <Link to="/" style={{ color: "#534AB7", fontSize: "14px", fontWeight: 600 }}>← Back to home</Link>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const listings = listingsData?.results || [];

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Profile header */}
      <div style={{ background: "#26215C", borderRadius: "16px", padding: "28px", marginBottom: "16px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <Avatar profile={profile} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0 }}>{profile.full_name}</h1>
            {profile.is_verified && (
              <span style={{ background: "#1D9E75", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px" }}>
                ✓ Verified
              </span>
            )}
          </div>
          {profile.location && (
            <p style={{ fontSize: "13px", color: "#AFA9EC", margin: "0 0 4px" }}>📍 {profile.location}</p>
          )}
          <p style={{ fontSize: "12px", color: "#AFA9EC", margin: 0 }}>
            Member since {memberSince} · {profile.listing_count} active listing{profile.listing_count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>About</h2>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
        </div>
      )}

      {/* Active listings */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", marginBottom: "10px" }}>
          Active listings {listings.length > 0 && <span style={{ color: "#888", fontWeight: 400 }}>({listings.length})</span>}
        </h2>

        {listingsLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ background: "#e5e5e5", borderRadius: "12px", height: "72px", animation: "pulse 1.5s infinite" }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
          </div>
        )}

        {!listingsLoading && listings.length === 0 && (
          <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>No active listings at the moment.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {listings.map((listing) => {
            const typeColor = TYPE_COLORS[listing.listing_type] || TYPE_COLORS.job;
            const emoji = TYPE_EMOJIS[listing.listing_type] || "📌";
            const path = `/${TYPE_PATHS[listing.listing_type] || "listings"}/${listing.slug}`;
            return (
              <Link
                key={listing.id}
                to={path}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#AFA9EC")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: typeColor.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {listing.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                      <span style={{ background: typeColor.bg, color: typeColor.color, fontSize: "10px", fontWeight: 500, padding: "1px 7px", borderRadius: "8px", marginRight: "6px" }}>
                        {listing.listing_type}
                      </span>
                      📍 {listing.location}, {listing.state}
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", color: "#534AB7", fontWeight: 600, flexShrink: 0 }}>View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
