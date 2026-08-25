import { useParams, useNavigate, Link } from "react-router-dom";
import { EyeIcon, WarningIcon, FlagIcon, MapPinIcon, ClockIcon, PhoneIcon, EnvelopeIcon, NewspaperIcon, TagIcon, WrenchIcon, MagnifyingGlassIcon, GraduationCapIcon, MegaphoneIcon, PushPinIcon } from "@phosphor-icons/react";
import { mapsUrl } from "../../utils/constants";
import { useQuery } from "@tanstack/react-query";
import { getNoticeByListing } from "../../api/notices";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import MessageButton from "../../components/ui/MessageButton";
import GetInTouchSection from "../../components/ui/GetInTouchSection";
import VerifiedBadge from "../../components/ui/VerifiedBadge";
import WhatsAppButton from "../../components/ui/WhatsAppButton";
import usePageMeta from "../../hooks/usePageMeta";
import { trackView, getSimilarListings } from "../../api/listings";
import { useEffect } from "react";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";
import JsonLd from "../../components/ui/JsonLd";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins === 1 ? "1 min ago" : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

const CATEGORY_COLORS = {
  news: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC" },
  sale: { bg: "#FFF1E0", color: "#633806", border: "#EFD9C0" },
  service: { bg: "#E1F5EE", color: "#085041", border: "#9FE1CB" },
  lost_found: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  education: { bg: "#E6F1FB", color: "#0C447C", border: "#B5D4F4" },
  general: { bg: "#F1EFE8", color: "#444441", border: "#D3D1C7" },
};

const CATEGORY_ICONS = {
  news: NewspaperIcon,
  sale: TagIcon,
  service: WrenchIcon,
  lost_found: MagnifyingGlassIcon,
  education: GraduationCapIcon,
  general: MegaphoneIcon,
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

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

export default function NoticeDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  const {
    data: notice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notice", slug],
    queryFn: () => getNoticeByListing(slug),
    staleTime: 0,
    gcTime: 0,
  });

  const { data: similarListings } = useQuery({
    queryKey: ["similar", notice?.listing_id],
    queryFn: () => getSimilarListings(notice?.listing_id),
    enabled: !!notice?.listing_id,
    retry: false,
  });

  usePageMeta(
    notice?.listing_title ? `${notice.listing_title} — Notice` : null,
    notice?.description,
    notice?.images?.[0]?.url,
  );

  useEffect(() => {
    if (notice?.listing_id)
      trackView(notice.listing_id).catch(() => {});
  }, [notice?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <>
        <meta name="robots" content="noindex, nofollow" />
        <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
          Notice not found or has been removed.
        </div>
      </>
    );

  const catColor =
    CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.general;
  const CatIcon = CATEGORY_ICONS[notice.category] || MegaphoneIcon;
  const initial = notice.posted_by?.[0]?.toUpperCase() || "?";
  const footerBg = "#0C447C";

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": notice.listing_title,
        "description": notice.description,
        "datePublished": notice.created_at,
        "author": { "@type": "Person", "name": notice.posted_by || "NepSaathi" },
        "publisher": { "@type": "Organization", "name": "NepSaathi", "url": "https://www.nepsaathi.com" },
        ...(notice.images?.[0]?.url && { "image": notice.images[0].url }),
      }} />
      <style>{`
        .ann-detail-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) { .ann-detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: isMobile ? "14px" : "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Breadcrumb ── */}
        <nav aria-label="breadcrumb" style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "14px", fontSize: "12px", color: "#aaa" }}>
          <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Home</Link>
          <span>›</span>
          <Link to="/notices" style={{ color: "#aaa", textDecoration: "none" }}>Notices</Link>
          {notice?.listing_title && <><span>›</span><span style={{ color: "#534AB7", fontWeight: 500 }}>{notice.listing_title}</span></>}
        </nav>

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
            onClick={() => navigate("/notices")}
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
            <IconBack /> Back to notices
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {notice?.view_count > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#666", background: "#f5f4f0", borderRadius: "20px", padding: "5px 10px", fontWeight: 500 }}>
                <EyeIcon size={13} weight="regular" style={{ flexShrink: 0 }} />
                {notice.view_count} views
              </span>
            )}
            <MessageButton
              recipientId={notice?.user_id}
              listingId={notice?.listing_id}
              listingTitle={notice?.listing_title}
              listingType="notice"
              compact={isMobile}
            />
            <SaveButton
              listingId={notice?.listing_id}
              compact={isMobile}
            />
            <ShareButton
              title={notice?.listing_title}
              compact={isMobile}
            />
          </div>
        </div>

        {/* ── Under review (spam detection — owner only sees this) ── */}
        {notice?.is_under_review && (
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
            <WarningIcon size={20} weight="fill" color="#633806" />
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#633806" }}
              >
                Your listing is pending review
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
              >
                {notice?.is_reported
                  ? "A user has reported this listing. Our team will review it within 24 hours."
                  : "A similar listing was detected. Our team will review and make it visible within 24 hours."
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Reported banner (visible to all) ── */}
        {!notice?.is_under_review && notice?.is_reported && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "12px",
              padding: "12px 18px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FlagIcon size={20} weight="fill" color="#A32D2D" />
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#A32D2D" }}
              >
                This listing has been reported
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
              >
                A community member has flagged this post. Our team is reviewing it.
              </div>
            </div>
          </div>
        )}

        {/* ── Image gallery ── */}
        {notice?.images?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <ImageGallery images={notice.images} title={notice.listing_title} />
          </div>
        )}

        {/* ── Hero banner ── */}
        <div
          style={{
            background: `radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.55) 0%, ${catColor.bg} 70%)`,
            border: `1.5px solid ${catColor.border}`,
            borderRadius: "20px",
            padding: isMobile ? "20px 16px" : "32px 28px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "14px" : "24px",
          }}
        >
          {/* Icon block */}
          <div
            style={{
              width: isMobile ? "56px" : "80px",
              height: isMobile ? "56px" : "80px",
              borderRadius: "16px",
              background: "#fff",
              border: `1.5px solid ${catColor.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 2px 0 ${catColor.border}`,
            }}
          >
            <CatIcon size={isMobile ? 26 : 36} weight="duotone" color={catColor.color} />
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
                <CatIcon size={11} weight="fill" color={catColor.color} style={{ marginRight: "4px", verticalAlign: "middle" }} />{notice.category?.replace("_", " ")}
              </span>
              {notice.is_urgent && (
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
                  <WarningIcon size={11} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} /> Urgent
                </span>
              )}
              {notice.is_free && (
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
              {notice.is_featured && (
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
                fontSize: isMobile ? "19px" : "24px",
                fontWeight: 700,
                color: "#26215C",
                margin: "0 0 8px",
                lineHeight: 1.25,
              }}
            >
              {notice.listing_title}
            </h1>
            <span
              style={{
                fontSize: "14px",
                color: catColor.color,
                fontWeight: 600,
              }}
            >
              <a
                href={mapsUrl([notice.listing_location, notice.listing_state, "Australia"].filter(Boolean).join(", "))}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <MapPinIcon size={14} weight="fill" color="#E87722" style={{ flexShrink: 0 }} />{notice.listing_location}, {notice.listing_state}
              </a>
            </span>
            {notice.created_at && (
              <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
                <ClockIcon size={12} weight="regular" color="#999" style={{ verticalAlign: "middle", marginRight: "3px" }} />Posted {timeAgo(notice.created_at)}
              </div>
            )}
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
                {notice.description ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#444",
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {notice.description}
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                    No description provided.
                  </p>
                )}

                {/* Expiry pill */}
                {notice.expires_at && (() => {
                  const d = daysUntil(notice.expires_at);
                  const label = d <= 0 ? "Expired" : d === 1 ? "Expires tomorrow" : `Expires in ${d} days`;
                  const color = d <= 0 ? "#ef4444" : d <= 3 ? "#f97316" : d <= 7 ? "#d97706" : "#9ca3af";
                  const bg    = d <= 0 ? "#fef2f2" : d <= 3 ? "#fff7ed" : d <= 7 ? "#fffbeb" : "#f9fafb";
                  return (
                    <>
                      <div style={{ borderTop: "0.5px solid #f0f0f0", margin: "16px 0 12px" }} />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color, background: bg, border: `1px solid ${color}40`, borderRadius: "20px", padding: "4px 10px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {label}
                      </span>
                    </>
                  );
                })()}
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
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      label: "Category",
                      value: notice.category?.replace("_", " "),
                    },
                    {
                      label: "Location",
                      value: `${notice.listing_location}, ${notice.listing_state}`,
                    },
                    (notice.price || notice.is_free) && {
                      label: "Price",
                      value: notice.price_display,
                    },
                    notice.condition &&
                      notice.condition !== "na" && {
                        label: "Condition",
                        value: notice.condition?.replace("_", " "),
                      },
                    notice.expires_at && {
                      label: "Expires",
                      value: new Date(
                        notice.expires_at,
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
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Link
                    to={`/users/${notice.user_id}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {notice.posted_by}
                  </Link>
                  {notice.poster_is_verified && <VerifiedBadge size={14} />}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  Posted{" "}
                  <span title={notice.created_at ? new Date(notice.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : ""}>
                    {timeAgo(notice.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Price card */}
            {(notice.price || notice.is_free) && (
              <div
                style={{
                  background: notice.is_free ? "#1D9E75" : footerBg,
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
                  {notice.is_free ? "Free listing" : "Price"}
                </div>
                <div
                  style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}
                >
                  {notice.price_display}
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
                    <a
                      href={mapsUrl([notice.listing_location, notice.listing_state, "Australia"].filter(Boolean).join(", "))}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {notice.listing_location},{" "}
                      {notice.listing_state}
                    </a>
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
                    <span title={notice.created_at ? new Date(notice.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : ""}>
                      {timeAgo(notice.created_at)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Seller card */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "0.5px solid #f0f0f0" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: footerBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#26215C", display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
                    <Link
                      to={`/users/${notice.user_id}`}
                      style={{ color: "inherit", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {notice.posted_by}
                    </Link>
                    {notice.poster_is_verified && <VerifiedBadge size={14} />}
                  </div>
                  {notice.user_joined && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                      Member since {new Date(notice.user_joined).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <MessageButton
                  recipientId={notice.user_id}
                  listingId={notice.listing_id}
                  listingTitle={notice.listing_title}
                  listingType="notice"
                  fullWidth
                />
                {isAuthenticated && (
                  <>
                    {notice.contact_phone && (
                      <a href={`tel:${notice.contact_phone}`} style={{ display: "block", textAlign: "center", background: "#f0f6ff", color: footerBg, padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                        <PhoneIcon size={13} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />{notice.contact_phone}
                      </a>
                    )}
                    {notice.contact_whatsapp && (
                      <WhatsAppButton phone={notice.contact_whatsapp} listingTitle={notice.listing_title} size="small" />
                    )}
                    {notice.contact_email && (
                      <a href={`mailto:${notice.contact_email}`} style={{ display: "block", textAlign: "center", background: "#f5f5f5", color: "#555", padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                        <EnvelopeIcon size={13} weight="regular" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />Email
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <ReportButton listingId={notice?.listing_id} backPath="/notices" />
            </div>
          </div>
        </div>

        {/* ── Get in touch ── */}
        <GetInTouchSection
          recipientId={notice.user_id}
          listingId={notice.listing_id}
          listingTitle={notice.listing_title}
          listingType="notice"
          postedBy={notice.posted_by}
          isVerified={notice.poster_is_verified}
          joinedDate={notice.user_joined}
          themeColor={footerBg}
          whatsapp={notice.contact_whatsapp || notice.contact_phone}
        />

        {/* ── Similar notices ── */}
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
                Similar notices
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
                  to={`/notices/${listing.slug}`}
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
                      flexShrink: 0,
                    }}
                  >
                    <MegaphoneIcon size={18} weight="duotone" color="#0C447C" />
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
                    <div style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "3px" }}>
                      <MapPinIcon size={11} weight="fill" color="#E87722" style={{ flexShrink: 0 }} />{listing.location}, {listing.state}
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
