import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoom, getRoomByListing } from "../../api/rooms";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import { trackView } from "../../api/listings";
import { useEffect } from "react";
import { getSimilarListings } from "../../api/listings";
import { Link } from "react-router-dom";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isListingRoute = location.pathname.includes("/listing/");
  const isMobile = useIsMobile();

  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["room", id, isListingRoute],
    queryFn: () => (isListingRoute ? getRoomByListing(id) : getRoom(id)),
  });
  const { data: similarListings } = useQuery({
    queryKey: ["similar", room?.listing_id],
    queryFn: () => getSimilarListings(room.listing_id),
    enabled: !!room?.listing_id,
  });

  usePageTitle(
    room?.listing_title ? `${room.listing_title} — Room` : "Room for Rent",
  );

  useEffect(() => {
    if (room?.listing_id) {
      trackView(room.listing_id).catch(() => {});
    }
  }, [room?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Room not found or has been removed.
      </div>
    );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px" }}>
      {/* Back button, share and save */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        {/* Left: back + views */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <button
            onClick={() => navigate("/rooms")}
            style={{
              background: "transparent",
              border: "none",
              color: "#534AB7",
              fontSize: "13px",
              cursor: "pointer",
              padding: 0,
              whiteSpace: "nowrap",
            }}
          >
            ← Back to rooms
          </button>
          {room?.view_count > 0 && (
            <span
              style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}
            >
              👁️ {room.view_count} {room.view_count === 1 ? "view" : "views"}
            </span>
          )}
        </div>
        {/* Right: save + share */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <SaveButton listingId={room?.listing_id} compact={isMobile} />
          <ShareButton title={room?.listing_title} compact={isMobile} />
        </div>
      </div>

      {/* Under review banner */}
      {room.is_under_review && (
        <div
          style={{
            background: "#FFF1E0",
            border: "0.5px solid #EFD9C0",
            borderRadius: "10px",
            padding: "12px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: 600, color: "#633806" }}
            >
              This listing is under review
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
              A report has been submitted and our admin team is reviewing it.
            </div>
          </div>
        </div>
      )}
      {/* Image gallery */}
      {room?.images?.length > 0 && <ImageGallery images={room.images} />}

      {/* Hero section */}
      <div
        style={{
          background: "#FFF1E0",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "12px",
        }}
      >
        <div>
          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "#fff",
                color: "#633806",
                fontSize: "11px",
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              🏠 {room.room_type?.replace("_", " ")}
            </span>
            {room.bills_included && (
              <span
                style={{
                  background: "#E1F5EE",
                  color: "#085041",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                Bills included
              </span>
            )}
            {room.nepalese_household && (
              <span
                style={{
                  background: "#EEEDFE",
                  color: "#3C3489",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                🇳🇵 Nepalese home
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "8px",
              lineHeight: 1.2,
            }}
          >
            {room.listing_title}
          </h1>
          <p style={{ fontSize: "13px", color: "#666" }}>
            📍 {room.listing_location}, {room.listing_state}
          </p>
        </div>

        {/* Price badge — full width */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #EFD9C0",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "14px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Weekly rent
          </span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#26215C" }}>
            {room.price_display}
          </span>
        </div>
      </div>

      {/* Main card */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Details grid */}
        <div
          className="room-details-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            borderBottom: "0.5px solid #e5e5e5",
          }}
        >
          {[
            { label: "Bedrooms", value: room.bedrooms },
            { label: "Bathrooms", value: room.bathrooms },
            { label: "Max occupants", value: room.max_occupants },
            { label: "Bond", value: room.bond?.replace("_", " ") },
            {
              label: "Expires",
              value: room.expires_at
                ? new Date(room.expires_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "30 days",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "16px",
                borderRight: "0.5px solid #e5e5e5",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#aaa",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: "14px", color: "#333", fontWeight: 600 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px" }}>
          {/* Description */}
          {room.description && (
            <>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#26215C",
                  marginBottom: "8px",
                }}
              >
                About this room
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555",
                  lineHeight: 1.7,
                  marginBottom: "20px",
                }}
              >
                {room.description}
              </p>
              <div
                style={{
                  borderTop: "0.5px solid #e5e5e5",
                  marginBottom: "20px",
                }}
              />
            </>
          )}

          {/* Features */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            {[
              room.furnishing && { label: room.furnishing, emoji: "🛋️" },
              room.bills_included && { label: "Bills included", emoji: "💡" },
              room.pets_allowed && { label: "Pets allowed", emoji: "🐾" },
              room.parking_available && { label: "Parking", emoji: "🚗" },
              room.nepalese_household && {
                label: "Nepalese household",
                emoji: "🇳🇵",
              },
            ]
              .filter(Boolean)
              .map(({ label, emoji }) => (
                <span
                  key={label}
                  style={{
                    background: "#F5F4F0",
                    color: "#555",
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "5px 12px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {emoji} {label}
                </span>
              ))}
          </div>

          {/* Available from */}
          {room.available_from && (
            <div
              style={{
                background: "#E1F5EE",
                border: "0.5px solid #9FE1CB",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "24px",
                fontSize: "13px",
                color: "#085041",
                fontWeight: 500,
              }}
            >
              📅 Available from{" "}
              {new Date(room.available_from).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {/* Posted by */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              padding: "12px 16px",
              background: "#F5F4F0",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#E87722",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {room.posted_by?.[0]?.toUpperCase()}
            </div>
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 500, color: "#26215C" }}
              >
                {room.posted_by}
              </div>
              <div style={{ fontSize: "11px", color: "#888" }}>
                Posted{" "}
                {new Date(room.created_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          <div
            style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
          />

          {/* Contact */}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "12px",
            }}
          >
            Contact landlord
          </h3>

          {isAuthenticated ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {room.contact_phone && (
                <a
                  href={`tel:${room.contact_phone}`}
                  style={{
                    background: "#E87722",
                    color: "#fff",
                    padding: "11px 22px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📞 Call {room.contact_phone}
                </a>
              )}
              {room.contact_whatsapp && (
                <a
                  href={`https://wa.me/${room.contact_whatsapp?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#25D366",
                    color: "#fff",
                    padding: "11px 22px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  💬 WhatsApp
                </a>
              )}
              {room.contact_email && (
                <a
                  href={`mailto:${room.contact_email}`}
                  style={{
                    background: "#FFF1E0",
                    color: "#E87722",
                    padding: "11px 22px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "0.5px solid #EFD9C0",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ✉️ Email
                </a>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#FFF1E0",
                border: "0.5px solid #EFD9C0",
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#26215C",
                    marginBottom: "3px",
                  }}
                >
                  Sign in to view contact details
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  Create a free account to contact the landlord
                </div>
              </div>
              <a
                href="/login"
                style={{
                  background: "#E87722",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Sign in →
              </a>
            </div>
          )}
          {/* Report */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <ReportButton listingId={room?.listing_id} />
          </div>
        </div>
      </div>
      {/* Similar listings */}
      {similarListings?.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "12px",
            }}
          >
            Similar rooms
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {similarListings.map((listing) => (
              <Link
                key={listing.id}
                to={`/rooms/listing/${listing.id}`}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
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
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "#EEEDFE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    💼
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#26215C",
                        marginBottom: "2px",
                      }}
                    >
                      {listing.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#888" }}>
                      📍 {listing.location}, {listing.state}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#534AB7",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  View →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 600px) {
          .room-details-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
