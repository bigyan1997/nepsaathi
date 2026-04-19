import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackView } from "../../api/listings";
import { useEffect } from "react";

import {
  getAnnouncement,
  getAnnouncementByListing,
} from "../../api/announcements";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";

const CATEGORY_COLORS = {
  news: { bg: "#EEEDFE", color: "#3C3489" },
  sale: { bg: "#FFF1E0", color: "#633806" },
  service: { bg: "#E1F5EE", color: "#085041" },
  lost_found: { bg: "#FCEBEB", color: "#A32D2D" },
  education: { bg: "#E6F1FB", color: "#0C447C" },
  general: { bg: "#F1EFE8", color: "#444441" },
};

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
    if (announcement?.listing_id) {
      trackView(announcement.listing_id).catch(() => {});
    }
  }, [announcement?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Announcement not found or has been removed.
      </div>
    );

  const catColor =
    CATEGORY_COLORS[announcement?.category] || CATEGORY_COLORS.general;

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
            onClick={() => navigate("/announcements")}
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
            ← Back to announcements
          </button>
          {announcement?.view_count > 0 && (
            <span
              style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}
            >
              👁️ {announcement.view_count}{" "}
              {announcement.view_count === 1 ? "view" : "views"}
            </span>
          )}
        </div>
        {/* Right: save + share */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <SaveButton listingId={announcement?.listing_id} compact={isMobile} />
          <ShareButton title={announcement?.listing_title} compact={isMobile} />
        </div>
      </div>

      {/* Under review banner */}
      {announcement?.is_under_review && (
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
      {announcement?.images?.length > 0 && (
        <ImageGallery images={announcement.images} />
      )}

      {/* Main card */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "16px",
            gap: "12px",
          }}
        >
          <div>
            {/* Badges */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: catColor.bg,
                  color: catColor.color,
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "8px",
                }}
              >
                {announcement.category?.replace("_", " ")}
              </span>
              {announcement.is_urgent && (
                <span
                  style={{
                    background: "#FCEBEB",
                    color: "#A32D2D",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "8px",
                  }}
                >
                  Urgent
                </span>
              )}
              {announcement.is_free && (
                <span
                  style={{
                    background: "#E1F5EE",
                    color: "#085041",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "8px",
                  }}
                >
                  Free
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#26215C",
                marginBottom: "4px",
              }}
            >
              {announcement.listing_title}
            </h1>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {announcement.listing_location}, {announcement.listing_state}
            </p>
          </div>

          {/* Price */}
          {(announcement.price || announcement.is_free) && (
            <div
              style={{
                background: announcement.is_free ? "#E1F5EE" : "#FFF1E0",
                border: `0.5px solid ${announcement.is_free ? "#9FE1CB" : "#EFD9C0"}`,
                borderRadius: "10px",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: announcement.is_free ? "#085041" : "#633806",
                }}
              >
                Price
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: announcement.is_free ? "#085041" : "#633806",
                }}
              >
                {announcement.price_display}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
        />

        {/* Description */}
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "8px",
          }}
        >
          Details
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#555",
            lineHeight: 1.7,
            marginBottom: "24px",
          }}
        >
          {announcement.description}
        </p>

        {/* Details grid */}
        {announcement.condition && announcement.condition !== "na" && (
          <>
            <div
              style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#aaa",
                    marginBottom: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Condition
                </div>
                <div
                  style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}
                >
                  {announcement.condition?.replace("_", " ")}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#aaa",
                    marginBottom: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Posted by
                </div>
                <div
                  style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}
                >
                  {announcement.posted_by}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Divider */}
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
          Contact
        </h3>

        {isAuthenticated ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {announcement.contact_phone && (
              <a
                href={`tel:${announcement.contact_phone}`}
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Call {announcement.contact_phone}
              </a>
            )}
            {announcement.contact_whatsapp && (
              <a
                href={`https://wa.me/${announcement.contact_whatsapp?.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#25D366",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                WhatsApp
              </a>
            )}
            {announcement.contact_email && (
              <a
                href={`mailto:${announcement.contact_email}`}
                style={{
                  background: "#FFF1E0",
                  color: "#E87722",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "0.5px solid #EFD9C0",
                }}
              >
                Email
              </a>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "#FFF1E0",
              border: "0.5px solid #EFD9C0",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "14px",
              color: "#633806",
            }}
          >
            Please{" "}
            <a href="/login" style={{ color: "#E87722", fontWeight: 500 }}>
              sign in
            </a>{" "}
            to view contact details.
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
          <ReportButton listingId={announcement?.listing_id} />
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
            Similar announcements
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {similarListings.map((listing) => (
              <Link
                key={listing.id}
                to={`/announcements/listing/${listing.id}`}
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
    </div>
  );
}
