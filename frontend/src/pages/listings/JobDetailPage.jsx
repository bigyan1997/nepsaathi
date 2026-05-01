import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJob, getJobByListing } from "../../api/jobs";
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
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isListingRoute = location.pathname.includes("/listing/");
  const isMobile = useIsMobile();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", id, isListingRoute],
    queryFn: () => (isListingRoute ? getJobByListing(id) : getJob(id)),
  });

  usePageTitle(
    job?.listing_title ? `${job.listing_title} — Job` : "Job Listing",
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

  return (
    <>
      <style>{`
        .job-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) { .job-grid { grid-template-columns: 1fr !important; } }
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

        {/* ── Under review ── */}
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
            padding: "32px 28px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Avatar / icon block */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "16px",
              background: isWanted ? "#534AB7" : "#fff",
              border: "1.5px solid #AFA9EC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isWanted ? "28px" : "36px",
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
                fontSize: "24px",
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
              <span
                style={{ fontSize: "14px", color: "#534AB7", fontWeight: 600 }}
              >
                📍 {job.listing_location}, {job.listing_state}
              </span>
            </div>
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
              </div>
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
                    gridTemplateColumns: "1fr 1fr",
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
                  }}
                >
                  {job.posted_by}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  {isWanted ? "Looking for work · " : "Posted "}
                  {new Date(job.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
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
                    {job.listing_location}, {job.listing_state}
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

            {/* Apply / Contact */}
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
                  {isWanted ? "CONTACT THIS PERSON" : "APPLY / CONTACT"}
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
                    {job.contact_phone && (
                      <a
                        href={`tel:${job.contact_phone}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "#534AB7",
                          color: "#fff",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        📞 Call {job.contact_phone}
                      </a>
                    )}
                    {job.contact_whatsapp && (
                      <a
                        href={`https://wa.me/${job.contact_whatsapp?.replace(/\D/g, "")}`}
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
                    {job.contact_email && (
                      <a
                        href={`mailto:${job.contact_email}`}
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
                        ? "Sign in to contact this job seeker"
                        : "Sign in to apply for this role"}
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

            {/* Report — tucked in sidebar */}
            <div style={{ textAlign: "center" }}>
              <ReportButton listingId={job?.listing_id} />
            </div>
          </div>
        </div>

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
                    to={`/jobs/listing/${listing.id}`}
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
