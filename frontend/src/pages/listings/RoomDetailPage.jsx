import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomByListing } from "../../api/rooms";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import MessageButton from "../../components/ui/MessageButton";
import usePageTitle from "../../hooks/usePageTitle";
import { trackView, getSimilarListings } from "../../api/listings";
import { useEffect } from "react";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";

const IconBack = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconPin = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconBed = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M3 9v11m0-5h18m0 5V9M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
    <path d="M3 13h4v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4" />
  </svg>
);
const IconCal = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconArrow = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function RoomDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["room", slug],
    queryFn: () => getRoomByListing(slug),
  });

  const { data: similarListings } = useQuery({
    queryKey: ["similar", room?.listing_id],
    queryFn: () => getSimilarListings(room?.listing_id),
    enabled: !!room?.listing_id,
    retry: false,
  });

  usePageTitle(
    room?.listing_title ? `${room.listing_title} — Room` : "Room for Rent",
  );

  useEffect(() => {
    if (room?.listing_id) trackView(room.listing_id).catch(() => {});
  }, [room?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Room not found or has been removed.
      </div>
    );

  const isWanted = room?.is_wanted;
  const initial = room.posted_by?.[0]?.toUpperCase() || "?";

  const features = [
    room.furnishing && {
      label: room.furnishing.replace("_", " "),
      emoji: "🛋️",
    },
    room.bills_included && {
      label: isWanted ? "Bills preferred" : "Bills included",
      emoji: "💡",
    },
    room.pets_allowed && {
      label: isWanted ? "Has pets" : "Pets allowed",
      emoji: "🐾",
    },
    room.parking_available && {
      label: isWanted ? "Needs parking" : "Parking",
      emoji: "🚗",
    },
    room.nepalese_household && { label: "Nepalese household", emoji: "🇳🇵" },
  ].filter(Boolean);

  return (
    <>
      <style>{`
        .room-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) { .room-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Top nav ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
          >
            <IconBack /> Back to rooms
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {room?.view_count > 0 && (
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                👁️ {room.view_count}
              </span>
            )}
            <MessageButton
              recipientId={room?.user_id}
              listingId={room?.listing_id}
              listingTitle={room?.listing_title}
              listingType="room"
              compact={isMobile}
            />
            <SaveButton listingId={room?.listing_id} compact={isMobile} />
            <ShareButton title={room?.listing_title} compact={isMobile} />
          </div>
        </div>

        {/* ── Under review ── */}
        {room.is_under_review && (
          <div
            style={{
              background: "#FFF1E0",
              border: "0.5px solid #EFD9C0",
              borderRadius: "12px",
              padding: "12px 18px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>⚠️</span>
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#633806" }}
              >
                This listing is under review
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
              >
                A report has been submitted and our admin team is reviewing it.
              </div>
            </div>
          </div>
        )}

        {/* ── Image gallery ── */}
        {room?.images?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <ImageGallery images={room.images} />
          </div>
        )}

        {/* ── Hero banner ── */}
        <div
          style={{
            background: "#FFF1E0",
            border: isWanted ? "1.5px solid #E87722" : "1.5px solid #EFD9C0",
            borderRadius: "20px",
            padding: "32px 28px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Icon block */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "16px",
              background: isWanted ? "#E87722" : "#fff",
              border: "1.5px solid #EFD9C0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isWanted ? "28px" : "36px",
              fontWeight: 700,
              color: isWanted ? "#fff" : undefined,
              flexShrink: 0,
              boxShadow: "0 2px 0 #EFD9C0",
            }}
          >
            {isWanted ? initial : "🏠"}
          </div>

          {/* Title block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              {isWanted && (
                <span
                  style={{
                    background: "#E87722",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  🏘️ Looking for room
                </span>
              )}
              {room.is_featured && (
                <span
                  style={{
                    background: "#E87722",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  ⭐ Featured
                </span>
              )}
              <span
                style={{
                  background: "#fff",
                  color: "#633806",
                  border: "1px solid #EFD9C0",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 12px",
                  borderRadius: "20px",
                }}
              >
                🏠 {room.room_type?.replace("_", " ")}
              </span>
              {room.bills_included && (
                <span
                  style={{
                    background: "#1D9E75",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  Bills included
                </span>
              )}
              {room.nepalese_household && (
                <span
                  style={{
                    background: "#534AB7",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  🇳🇵 Nepalese home
                </span>
              )}
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#26215C",
                margin: "0 0 8px",
                lineHeight: 1.25,
              }}
            >
              {room.listing_title}
            </h1>
            <span
              style={{ fontSize: "14px", color: "#E87722", fontWeight: 600 }}
            >
              📍 {room.listing_location}, {room.listing_state}
            </span>
          </div>
        </div>

        {/* ── Two-col grid ── */}
        <div className="room-grid">
          {/* LEFT */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* About */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div style={{ background: "#26215C", padding: "14px 20px" }}>
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  {isWanted ? "About me" : "About this room"}
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {room.description ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#444",
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {room.description}
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                    No description provided.
                  </p>
                )}

                {/* Features */}
                {features.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "18px",
                    }}
                  >
                    {features.map(({ label, emoji }) => (
                      <span
                        key={label}
                        style={{
                          background: "#F5F4F0",
                          color: "#555",
                          fontSize: "12px",
                          fontWeight: 500,
                          padding: "5px 12px",
                          borderRadius: "20px",
                        }}
                      >
                        {emoji} {label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Availability banner */}
                {room.available_from && (
                  <div
                    style={{
                      marginTop: "16px",
                      background: isWanted ? "#FFF1E0" : "#E1F5EE",
                      border: `0.5px solid ${isWanted ? "#EFD9C0" : "#9FE1CB"}`,
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: isWanted ? "#633806" : "#085041",
                      fontWeight: 500,
                    }}
                  >
                    📅{" "}
                    {isWanted ? "Looking to move in from " : "Available from "}
                    {new Date(room.available_from).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}

                {/* Room seeker tip */}
                {isWanted && isAuthenticated && (
                  <div
                    style={{
                      marginTop: "14px",
                      background: "#FFF1E0",
                      border: "0.5px solid #EFD9C0",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: "#633806",
                    }}
                  >
                    💡 This person is looking for a room — reach out if you have
                    one available!
                  </div>
                )}
              </div>
            </div>

            {/* Room details — orange tinted */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #EFD9C0",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#FFF1E0",
                  borderBottom: "0.5px solid #EFD9C0",
                  padding: "14px 20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#633806",
                    margin: 0,
                  }}
                >
                  Room details
                </h3>
              </div>
              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {(isWanted
                    ? [
                        {
                          label: "Room type needed",
                          value: room.room_type?.replace("_", " ") || "—",
                        },
                        {
                          label: "Furnishing pref.",
                          value: room.furnishing?.replace("_", " ") || "Any",
                        },
                        {
                          label: "Move in",
                          value: room.available_from
                            ? new Date(room.available_from).toLocaleDateString(
                                "en-AU",
                                { day: "numeric", month: "short" },
                              )
                            : "Flexible",
                        },
                        { label: "Max budget/week", value: room.price_display },
                      ]
                    : [
                        {
                          label: "Room type",
                          value: room.room_type?.replace("_", " ") || "—",
                        },
                        { label: "Bedrooms", value: room.bedrooms || "—" },
                        { label: "Bathrooms", value: room.bathrooms || "—" },
                        {
                          label: "Max occupants",
                          value: room.max_occupants || "—",
                        },
                        {
                          label: "Bond",
                          value: room.bond?.replace("_", " ") || "—",
                        },
                        {
                          label: "Expires",
                          value: room.expires_at
                            ? new Date(room.expires_at).toLocaleDateString(
                                "en-AU",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "30 days",
                        },
                      ]
                  ).map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#E87722",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontWeight: 700,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#26215C",
                          fontWeight: 600,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Posted by */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "16px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#E87722",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#26215C",
                  }}
                >
                  {room.posted_by}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  {isWanted ? "Looking for room · " : "Posted "}
                  {new Date(room.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              {isWanted && (
                <span
                  style={{
                    background: "#E87722",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  🏘️ Room Seeker
                </span>
              )}
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Price card */}
            <div
              style={{
                background: "#E87722",
                borderRadius: "14px",
                padding: "20px 18px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                {isWanted ? "Max budget / week" : "Weekly rent"}
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}>
                {room.price_display}
              </div>
            </div>

            {/* Quick info */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div style={{ background: "#26215C", padding: "10px 16px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#AFA9EC",
                    letterSpacing: "0.06em",
                  }}
                >
                  QUICK INFO
                </div>
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#E87722",
                  }}
                >
                  <IconBed />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#26215C",
                      fontWeight: 500,
                    }}
                  >
                    {room.room_type?.replace("_", " ")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#E87722",
                  }}
                >
                  <IconPin />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#26215C",
                      fontWeight: 500,
                    }}
                  >
                    {room.listing_location}, {room.listing_state}
                  </span>
                </div>
                {room.available_from && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#E87722",
                    }}
                  >
                    <IconCal />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#26215C",
                        fontWeight: 500,
                      }}
                    >
                      {isWanted ? "From " : "Available "}
                      {new Date(room.available_from).toLocaleDateString(
                        "en-AU",
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div style={{ background: "#E87722", padding: "10px 16px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.06em",
                  }}
                >
                  {isWanted ? "CONTACT THIS PERSON" : "CONTACT LANDLORD"}
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                {isAuthenticated ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {room.contact_phone && (
                      <a
                        href={`tel:${room.contact_phone}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "#E87722",
                          color: "#fff",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
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
                          display: "block",
                          textAlign: "center",
                          background: "#25D366",
                          color: "#fff",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        WhatsApp
                      </a>
                    )}
                    {room.contact_email && (
                      <a
                        href={`mailto:${room.contact_email}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "#FFF1E0",
                          color: "#E87722",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "0.5px solid #EFD9C0",
                        }}
                      >
                        ✉️ Email
                      </a>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {isWanted
                        ? "Sign in to contact this room seeker"
                        : "Sign in to contact the landlord"}
                    </p>
                    <a
                      href="/login"
                      style={{
                        display: "block",
                        textAlign: "center",
                        background: "#E87722",
                        color: "#fff",
                        padding: "10px",
                        borderRadius: "9px",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      Sign in →
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <ReportButton listingId={room?.listing_id} />
            </div>
          </div>
        </div>

        {/* ── Similar rooms ── */}
        {similarListings?.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                background: "#26215C",
                borderRadius: "12px 12px 0 0",
                padding: "14px 20px",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                }}
              >
                Similar rooms
              </h2>
            </div>
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "0 0 16px 16px",
                overflow: "hidden",
              }}
            >
              {similarListings.map((listing, i) => (
                <Link
                  key={listing.id}
                  to={`/rooms/${listing.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 20px",
                    borderBottom:
                      i === similarListings.length - 1
                        ? "none"
                        : "0.5px solid #f5f5f5",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F5F4F0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#FFF1E0",
                      border: "0.5px solid #EFD9C0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    🏠
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#26215C",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "3px",
                      }}
                    >
                      {listing.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      📍 {listing.location}, {listing.state}
                    </div>
                  </div>
                  <span style={{ color: "#E87722", flexShrink: 0 }}>
                    <IconArrow />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
