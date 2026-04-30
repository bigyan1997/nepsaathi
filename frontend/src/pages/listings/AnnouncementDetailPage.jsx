import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getAnnouncement,
  getAnnouncementByListing,
} from "../../api/announcements";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import { trackView, getSimilarListings } from "../../api/listings";
import { useEffect } from "react";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";

const CATEGORY_COLORS = {
  news: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC" },
  sale: { bg: "#FFF1E0", color: "#633806", border: "#EFD9C0" },
  service: { bg: "#E1F5EE", color: "#085041", border: "#9FE1CB" },
  lost_found: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  education: { bg: "#E6F1FB", color: "#0C447C", border: "#B5D4F4" },
  general: { bg: "#F1EFE8", color: "#444441", border: "#D3D1C7" },
};

const CATEGORY_EMOJIS = {
  news: "📰",
  sale: "🏷️",
  service: "🛠️",
  lost_found: "🔎",
  education: "📚",
  general: "📢",
};

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

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isListingRoute = location.pathname.includes("/listing/");
  const isMobile = useIsMobile();

  const {
    data: announcement,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["announcement", id, isListingRoute],
    queryFn: () =>
      isListingRoute ? getAnnouncementByListing(id) : getAnnouncement(id),
  });

  const { data: similarListings } = useQuery({
    queryKey: ["similar", announcement?.listing_id],
    queryFn: () => getSimilarListings(announcement.listing_id),
    enabled: !!announcement?.listing_id,
  });

  usePageTitle(
    announcement?.listing_title
      ? `${announcement.listing_title} — Announcement`
      : "Announcement",
  );

  useEffect(() => {
    if (announcement?.listing_id)
      trackView(announcement.listing_id).catch(() => {});
  }, [announcement?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Announcement not found or has been removed.
      </div>
    );

  const catColor =
    CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS.general;
  const catEmoji = CATEGORY_EMOJIS[announcement.category] || "📢";
  const initial = announcement.posted_by?.[0]?.toUpperCase() || "?";
  const footerBg = "#0C447C";

  return (
    <>
      <style>{`
        .ann-detail-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) { .ann-detail-grid { grid-template-columns: 1fr !important; } }
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
            onClick={() => navigate("/announcements")}
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
            <IconBack /> Back to announcements
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {announcement?.view_count > 0 && (
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                👁️ {announcement.view_count}
              </span>
            )}
            <SaveButton
              listingId={announcement?.listing_id}
              compact={isMobile}
            />
            <ShareButton
              title={announcement?.listing_title}
              compact={isMobile}
            />
          </div>
        </div>

        {/* ── Under review ── */}
        {announcement?.is_under_review && (
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
        {announcement?.images?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <ImageGallery images={announcement.images} />
          </div>
        )}

        {/* ── Hero banner ── */}
        <div
          style={{
            background: catColor.bg,
            border: `1.5px solid ${catColor.border}`,
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
              background: "#fff",
              border: `1.5px solid ${catColor.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              flexShrink: 0,
              boxShadow: `0 2px 0 ${catColor.border}`,
            }}
          >
            {catEmoji}
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
              <span
                style={{
                  background: "#fff",
                  color: catColor.color,
                  border: `1px solid ${catColor.border}`,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 12px",
                  borderRadius: "20px",
                }}
              >
                {catEmoji} {announcement.category?.replace("_", " ")}
              </span>
              {announcement.is_urgent && (
                <span
                  style={{
                    background: "#A32D2D",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  🔴 Urgent
                </span>
              )}
              {announcement.is_free && (
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
                  Free
                </span>
              )}
              {announcement.is_featured && (
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
              {announcement.listing_title}
            </h1>
            <span
              style={{
                fontSize: "14px",
                color: catColor.color,
                fontWeight: 600,
              }}
            >
              📍 {announcement.listing_location}, {announcement.listing_state}
            </span>
          </div>
        </div>

        {/* ── Two-col grid ── */}
        <div className="ann-detail-grid">
          {/* LEFT */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Details */}
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
                  Details
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {announcement.description ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#444",
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {announcement.description}
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                    No description provided.
                  </p>
                )}
              </div>
            </div>

            {/* Info — category tinted */}
            <div
              style={{
                background: "#fff",
                border: `0.5px solid ${catColor.border}`,
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: catColor.bg,
                  borderBottom: `0.5px solid ${catColor.border}`,
                  padding: "14px 20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: catColor.color,
                    margin: 0,
                  }}
                >
                  Listing info
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
                  {[
                    {
                      label: "Category",
                      value: announcement.category?.replace("_", " "),
                    },
                    {
                      label: "Location",
                      value: `${announcement.listing_location}, ${announcement.listing_state}`,
                    },
                    (announcement.price || announcement.is_free) && {
                      label: "Price",
                      value: announcement.price_display,
                    },
                    announcement.condition &&
                      announcement.condition !== "na" && {
                        label: "Condition",
                        value: announcement.condition?.replace("_", " "),
                      },
                    announcement.expires_at && {
                      label: "Expires",
                      value: new Date(
                        announcement.expires_at,
                      ).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    },
                  ]
                    .filter(Boolean)
                    .map(({ label, value }) => (
                      <div key={label}>
                        <div
                          style={{
                            fontSize: "10px",
                            color: catColor.color,
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
                  background: footerBg,
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
                  {announcement.posted_by}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  Posted{" "}
                  {new Date(announcement.created_at).toLocaleDateString(
                    "en-AU",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Price card */}
            {(announcement.price || announcement.is_free) && (
              <div
                style={{
                  background: announcement.is_free ? "#1D9E75" : footerBg,
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
                  {announcement.is_free ? "Free listing" : "Price"}
                </div>
                <div
                  style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}
                >
                  {announcement.price_display}
                </div>
              </div>
            )}

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
                    color: catColor.color,
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
                    {announcement.listing_location},{" "}
                    {announcement.listing_state}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: catColor.color,
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
                    {new Date(announcement.created_at).toLocaleDateString(
                      "en-AU",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                </div>
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
                  CONTACT
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
                    {announcement.contact_phone && (
                      <a
                        href={`tel:${announcement.contact_phone}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: footerBg,
                          color: "#fff",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        📞 Call {announcement.contact_phone}
                      </a>
                    )}
                    {announcement.contact_whatsapp && (
                      <a
                        href={`https://wa.me/${announcement.contact_whatsapp?.replace(/\D/g, "")}`}
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
                    {announcement.contact_email && (
                      <a
                        href={`mailto:${announcement.contact_email}`}
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
                    {!announcement.contact_phone &&
                      !announcement.contact_whatsapp &&
                      !announcement.contact_email && (
                        <p
                          style={{ fontSize: "13px", color: "#aaa", margin: 0 }}
                        >
                          No contact details provided.
                        </p>
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
                      Sign in to view contact details
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
              <ReportButton listingId={announcement?.listing_id} />
            </div>
          </div>
        </div>

        {/* ── Similar announcements ── */}
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
                Similar announcements
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
                  to={`/announcements/listing/${listing.id}`}
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
                      background: "#E6F1FB",
                      border: "0.5px solid #B5D4F4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    📢
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
                  <span style={{ color: "#534AB7", flexShrink: 0 }}>
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
