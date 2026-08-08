import { useParams, useNavigate, Link } from "react-router-dom";
import { mapsUrl } from "../../utils/constants";
import { useQuery } from "@tanstack/react-query";
import { getJobByListing } from "../../api/jobs";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import MessageButton from "../../components/ui/MessageButton";
import GetInTouchSection from "../../components/ui/GetInTouchSection";
import VerifiedBadge from "../../components/ui/VerifiedBadge";
import usePageMeta from "../../hooks/usePageMeta";
import { trackView, getSimilarListings } from "../../api/listings";
import MarketBenchmark from "../../components/ui/MarketBenchmark";
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

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

/* ── icons ── */
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
const IconBag = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const IconClock = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

/* ══════════════════════════════════════════════════ */
export default function JobDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", slug],
    queryFn: () => getJobByListing(slug),
    staleTime: 0,
    gcTime: 0,
  });

  usePageMeta(
    job?.listing_title ? `${job.listing_title} — Job` : null,
    job?.description,
  );

  const { data: similarListings } = useQuery({
    queryKey: ["similar", job?.listing_id],
    queryFn: () => getSimilarListings(job?.listing_id),
    enabled: !!job?.listing_id,
    retry: false,
  });

  useEffect(() => {
    if (job?.listing_id) trackView(job.listing_id).catch(() => {});
  }, [job?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Job not found or has been removed.
      </div>
    );

  const isWanted = job?.is_wanted;

  /* avatar initial */
  const initial = job.posted_by?.[0]?.toUpperCase() || "?";

  const jobTypeMap = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    casual: "OTHER",
    contract: "CONTRACTOR",
    internship: "INTERN",
    volunteer: "VOLUNTEER",
  };

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": job.listing_title,
        "description": job.description,
        "datePosted": job.created_at,
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.company_name || "NepSaathi",
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": job.location,
            "addressRegion": job.state,
            "addressCountry": "AU",
          },
        },
        ...(job.salary && {
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "AUD",
            "value": {
              "@type": "QuantitativeValue",
              "value": Number(job.salary),
              "unitText": job.salary_type?.toUpperCase() || "YEAR",
            },
          },
        }),
        "employmentType": jobTypeMap[job.job_type] || "OTHER",
      }} />
      <style>{`
        .job-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) { .job-grid { grid-template-columns: 1fr !important; } }
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
            onClick={() => navigate("/jobs")}
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
            <IconBack /> Back to jobs
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {job?.view_count > 0 && (
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                👁️ {job.view_count}
              </span>
            )}
            <MessageButton
              recipientId={job?.user_id}
              listingId={job?.listing_id}
              listingTitle={job?.listing_title}
              listingType="job"
              compact={isMobile}
            />
            <SaveButton listingId={job?.listing_id} compact={isMobile} />
            <ShareButton title={job?.listing_title} compact={isMobile} />
          </div>
        </div>

        {/* ── Under review (spam detection — owner only sees this) ── */}
        {job.is_under_review && (
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
                Your listing is pending review
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
              >
                {job.is_reported
                  ? "A user has reported this listing. Our team will review it within 24 hours."
                  : "A similar listing was detected. Our team will review and make it visible within 24 hours."
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Reported banner (visible to all) ── */}
        {!job.is_under_review && job.is_reported && (
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
            <span>🚩</span>
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
        {job?.images?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <ImageGallery images={job.images} />
          </div>
        )}

        {/* ── Hero banner ── */}
        <div
          style={{
            background: "#EEEDFE",
            border: isWanted ? "1.5px solid #534AB7" : "1.5px solid #AFA9EC",
            borderRadius: "20px",
            padding: isMobile ? "20px 16px" : "32px 28px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "14px" : "24px",
          }}
        >
          {/* Avatar / icon block */}
          <div
            style={{
              width: isMobile ? "56px" : "80px",
              height: isMobile ? "56px" : "80px",
              borderRadius: "16px",
              background: isWanted ? "#534AB7" : "#fff",
              border: "1.5px solid #AFA9EC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isWanted ? (isMobile ? "20px" : "28px") : (isMobile ? "26px" : "36px"),
              fontWeight: 700,
              color: isWanted ? "#fff" : undefined,
              flexShrink: 0,
              boxShadow: "0 2px 0 #AFA9EC",
            }}
          >
            {isWanted ? initial : "💼"}
          </div>

          {/* Title block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
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
                    background: "#534AB7",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  🔍 Looking for work
                </span>
              )}
              {job.is_featured && (
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
              {job.is_urgent && !isWanted && (
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
              <span
                style={{
                  background: "#fff",
                  color: "#534AB7",
                  border: "1px solid #AFA9EC",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 12px",
                  borderRadius: "20px",
                }}
              >
                💼 {job.job_type?.replace("_", " ")}
              </span>
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
              {job.listing_title}
            </h1>

            {/* Company / posted by + location */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {!isWanted && job.company_name && (
                <>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#534AB7",
                      fontWeight: 600,
                    }}
                  >
                    {job.company_name}
                  </span>
                  <span style={{ color: "#AFA9EC" }}>·</span>
                </>
              )}
              <a
                href={mapsUrl([job.listing_location, job.listing_state, "Australia"].filter(Boolean).join(", "))}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "14px", color: "#534AB7", fontWeight: 600, textDecoration: "none" }}
              >
                📍 {job.listing_location}, {job.listing_state}
              </a>
            </div>
            {job.created_at && (
              <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
                🕐 Posted {timeAgo(job.created_at)}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-col grid ── */}
        <div className="job-grid">
          {/* LEFT column */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* About the role */}
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
                  {isWanted ? "About me" : "About the role"}
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {job.description ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#444",
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {job.description}
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                    No description provided.
                  </p>
                )}

                {/* Qualifications */}
                {job.qualifications && (
                  <>
                    <div
                      style={{
                        borderTop: "0.5px solid #f0f0f0",
                        margin: "20px 0",
                      }}
                    />
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#26215C",
                        margin: "0 0 10px",
                      }}
                    >
                      {isWanted
                        ? "My qualifications"
                        : "Qualifications required"}
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#444",
                        lineHeight: 1.8,
                        margin: 0,
                      }}
                    >
                      {job.qualifications}
                    </p>
                  </>
                )}

                {/* Seeker tip */}
                {isWanted && isAuthenticated && (
                  <div
                    style={{
                      marginTop: "18px",
                      background: "#EEEDFE",
                      border: "0.5px solid #AFA9EC",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: "#3C3489",
                    }}
                  >
                    💡 This person is looking for work — reach out if you have
                    an opportunity for them!
                  </div>
                )}

                {/* Expiry pill */}
                {job.expires_at && (() => {
                  const d = daysUntil(job.expires_at);
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
              <MarketBenchmark type="job" jobType={job.job_type} state={job.state} />
            </div>

            {/* Job details — purple tinted */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #AFA9EC",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#EEEDFE",
                  borderBottom: "0.5px solid #AFA9EC",
                  padding: "14px 20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#3C3489",
                    margin: 0,
                  }}
                >
                  Job details
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
                      label: isWanted ? "Work type" : "Job type",
                      value: job.job_type?.replace("_", " ") || "—",
                    },
                    {
                      label: isWanted ? "My experience" : "Experience",
                      value: job.experience_required || "Not specified",
                    },
                    {
                      label: "Location",
                      value: `${job.listing_location}, ${job.listing_state}`,
                    },
                    {
                      label: "Expires",
                      value: job.expires_at
                        ? new Date(job.expires_at).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "30 days from posting",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#534AB7",
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
                  background: "#534AB7",
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
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to={`/users/${job.user_id}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {job.posted_by}
                  </Link>
                  {job.poster_is_verified && <VerifiedBadge size={15} style={{ marginLeft: 4 }} />}
                  {isWanted && (
                    <span
                      style={{
                        background: "#534AB7",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🔍 Job Seeker
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  {isWanted ? "Looking for work · " : "Posted "}
                  <span title={job.created_at ? new Date(job.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : ""}>
                    {timeAgo(job.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Salary card — big bold purple */}
            <div
              style={{
                background: "#534AB7",
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
                {isWanted ? "Expected salary" : "Salary"}
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}>
                {job.salary_display}
              </div>
            </div>

            {/* Quick stats */}
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
                    color: "#534AB7",
                  }}
                >
                  <IconBag />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#26215C",
                      fontWeight: 500,
                    }}
                  >
                    {job.job_type?.replace("_", " ")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#534AB7",
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
                      href={mapsUrl([job.listing_location, job.listing_state, "Australia"].filter(Boolean).join(", "))}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {job.listing_location}, {job.listing_state}
                    </a>
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#534AB7",
                  }}
                >
                  <IconClock />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#26215C",
                      fontWeight: 500,
                    }}
                  >
                    {job.expires_at
                      ? `Expires ${new Date(job.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
                      : "Expires in 30 days"}
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
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#26215C", display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
                    <Link
                      to={`/users/${job.user_id}`}
                      style={{ color: "inherit", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {job.posted_by}
                    </Link>
                    {job.poster_is_verified && <VerifiedBadge size={14} />}
                  </div>
                  {job.user_joined && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                      Member since {new Date(job.user_joined).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <MessageButton
                  recipientId={job.user_id}
                  listingId={job.listing_id}
                  listingTitle={job.listing_title}
                  listingType="job"
                  fullWidth
                />
                {isAuthenticated && (
                  <>
                    {job.contact_phone && (
                      <a href={`tel:${job.contact_phone}`} style={{ display: "block", textAlign: "center", background: "#EEEDFE", color: "#534AB7", padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600, border: "0.5px solid #AFA9EC" }}>
                        📞 {job.contact_phone}
                      </a>
                    )}
                    {job.contact_whatsapp && (
                      <a href={`https://wa.me/${job.contact_whatsapp?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", background: "#25D366", color: "#fff", padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                        WhatsApp
                      </a>
                    )}
                    {job.contact_email && (
                      <a href={`mailto:${job.contact_email}`} style={{ display: "block", textAlign: "center", background: "#f5f5f5", color: "#555", padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                        ✉️ Email
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Report — tucked in sidebar */}
            <div style={{ textAlign: "center" }}>
              <ReportButton listingId={job?.listing_id} backPath="/jobs" />
            </div>
          </div>
        </div>

        {/* ── Get in touch ── */}
        <GetInTouchSection
          recipientId={job.user_id}
          listingId={job.listing_id}
          listingTitle={job.listing_title}
          listingType="job"
          postedBy={job.posted_by}
          isVerified={job.poster_is_verified}
          joinedDate={job.user_joined}
          themeColor="#534AB7"
        />

        {/* ── Similar jobs ── */}
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
                Similar jobs
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
              {similarListings.map((listing, i) => {
                const isLast = i === similarListings.length - 1;
                return (
                  <Link
                    key={listing.id}
                    to={`/jobs/${listing.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 20px",
                      borderBottom: isLast ? "none" : "0.5px solid #f5f5f5",
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
                        background: "#EEEDFE",
                        border: "0.5px solid #AFA9EC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      💼
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
