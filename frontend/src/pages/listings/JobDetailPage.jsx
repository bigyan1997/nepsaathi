import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJob, getJobByListing } from "../../api/jobs";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import { trackView, getSimilarListings } from "../../api/listings";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";

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
    queryFn: () => getSimilarListings(job.listing_id),
    enabled: !!job?.listing_id,
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

  // Color scheme based on type
  const scheme = isWanted
    ? {
        heroBg: "linear-gradient(135deg, #EEEDFE 0%, #E8E6FC 100%)",
        accent: "#534AB7",
        accentLight: "#EEEDFE",
        badgeBg: "#534AB7",
        badgeColor: "#fff",
      }
    : {
        heroBg: "#EEEDFE",
        accent: "#534AB7",
        accentLight: "#EEEDFE",
        badgeBg: "#fff",
        badgeColor: "#534AB7",
      };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px" }}>
      {/* Top bar */}
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
          }}
        >
          ← Back to jobs
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {job?.view_count > 0 && (
            <span style={{ fontSize: "11px", color: "#aaa" }}>
              👁️ {job.view_count}
            </span>
          )}
          <SaveButton listingId={job?.listing_id} compact={isMobile} />
          <ShareButton title={job?.listing_title} compact={isMobile} />
        </div>
      </div>

      {/* Under review banner */}
      {job.is_under_review && (
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
      {job?.images?.length > 0 && <ImageGallery images={job.images} />}

      {/* Hero section */}
      <div
        style={{
          background: scheme.heroBg,
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "12px",
          borderLeft: isWanted ? "4px solid #534AB7" : "none",
        }}
      >
        {/* Badges */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          {isWanted && (
            <span
              style={{
                background: "#534AB7",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              🔍 Looking for work
            </span>
          )}
          {job.is_urgent && !isWanted && (
            <span
              style={{
                background: "#FCEBEB",
                color: "#A32D2D",
                fontSize: "11px",
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              🔴 Urgent
            </span>
          )}
          {job.is_featured && (
            <span
              style={{
                background: "linear-gradient(135deg, #E87722, #534AB7)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              ⭐ Featured
            </span>
          )}
          <span
            style={{
              background: scheme.badgeBg,
              color: scheme.badgeColor,
              fontSize: "11px",
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: "20px",
              border: isWanted ? "none" : "0.5px solid #AFA9EC",
            }}
          >
            💼 {job.job_type?.replace("_", " ")}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#26215C",
            marginBottom: "6px",
            lineHeight: 1.25,
          }}
        >
          {job.listing_title}
        </h1>

        {/* Subtitle */}
        {isWanted ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#534AB7",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {job.posted_by?.[0]?.toUpperCase()}
            </div>
            <div>
              <span
                style={{ fontSize: "13px", fontWeight: 500, color: "#534AB7" }}
              >
                {job.posted_by}
              </span>
              <span style={{ fontSize: "13px", color: "#666" }}>
                {" "}
                · 📍 {job.listing_location}, {job.listing_state}
              </span>
            </div>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: "14px",
                color: "#534AB7",
                marginBottom: "3px",
                fontWeight: 500,
              }}
            >
              {job.company_name || "Company not specified"}
            </p>
            <p
              style={{ fontSize: "13px", color: "#666", marginBottom: "14px" }}
            >
              📍 {job.listing_location}, {job.listing_state}
            </p>
          </>
        )}

        {/* Salary badge */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #AFA9EC",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            {isWanted ? "Expected salary" : "Salary"}
          </span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#26215C" }}>
            {job.salary_display}
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
          className="job-details-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderBottom: "0.5px solid #e5e5e5",
          }}
        >
          {[
            {
              label: isWanted ? "Work type" : "Job type",
              value: job.job_type?.replace("_", " "),
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
            <div
              key={label}
              style={{
                padding: "16px 20px",
                borderRight: "0.5px solid #e5e5e5",
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
              <div style={{ fontSize: "13px", color: "#333", fontWeight: 500 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px" }}>
          {/* Description */}
          {job.description && (
            <>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#26215C",
                  marginBottom: "8px",
                }}
              >
                {isWanted ? "About me" : "About the role"}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555",
                  lineHeight: 1.7,
                  marginBottom: "20px",
                }}
              >
                {job.description}
              </p>
              <div
                style={{
                  borderTop: "0.5px solid #e5e5e5",
                  marginBottom: "20px",
                }}
              />
            </>
          )}

          {/* Qualifications */}
          {job.qualifications && (
            <>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#26215C",
                  marginBottom: "8px",
                }}
              >
                {isWanted ? "My qualifications" : "Qualifications"}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                }}
              >
                {job.qualifications}
              </p>
              <div
                style={{
                  borderTop: "0.5px solid #e5e5e5",
                  marginBottom: "24px",
                }}
              />
            </>
          )}

          {/* Posted by */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              padding: "12px 16px",
              background: isWanted ? "#EEEDFE" : "#F5F4F0",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#534AB7",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {job.posted_by?.[0]?.toUpperCase()}
            </div>
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 500, color: "#26215C" }}
              >
                {job.posted_by}
              </div>
              <div style={{ fontSize: "11px", color: "#888" }}>
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
                  marginLeft: "auto",
                  background: "#534AB7",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                🔍 Job Seeker
              </span>
            )}
          </div>

          <div
            style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
          />

          {/* Contact section */}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "12px",
            }}
          >
            {isWanted ? "Contact this person" : "Apply / Contact"}
          </h3>

          {isWanted && isAuthenticated && (
            <div
              style={{
                background: "#EEEDFE",
                border: "0.5px solid #AFA9EC",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#3C3489",
              }}
            >
              💡 This person is looking for work — reach out if you have an
              opportunity for them!
            </div>
          )}

          {isAuthenticated ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {job.contact_phone && (
                <a
                  href={`tel:${job.contact_phone}`}
                  style={{
                    background: "#534AB7",
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
                  📞 Call {job.contact_phone}
                </a>
              )}
              {job.contact_whatsapp && (
                <a
                  href={`https://wa.me/${job.contact_whatsapp?.replace(/\D/g, "")}`}
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
              {job.contact_email && (
                <a
                  href={`mailto:${job.contact_email}`}
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
                  {isWanted
                    ? "Create a free account to contact this job seeker"
                    : "Create a free account to apply for this job"}
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
            <ReportButton listingId={job?.listing_id} />
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
            Similar jobs
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {similarListings.map((listing) => (
              <Link
                key={listing.id}
                to={`/jobs/listing/${listing.id}`}
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
          .job-details-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
