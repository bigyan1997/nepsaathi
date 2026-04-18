import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJob, getJobByListing } from "../../api/jobs";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import { trackView } from "../../api/listings";
import { useEffect } from "react";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isListingRoute = location.pathname.includes("/listing/");

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
  useEffect(() => {
    if (job?.listing_id) {
      trackView(job.listing_id).catch(() => {});
    }
  }, [job?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Job not found or has been removed.
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
            onClick={() => navigate("/jobs")}
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
            ← Back to jobs
          </button>
          {job?.view_count > 0 && (
            <span
              style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}
            >
              👁️ {job.view_count}
            </span>
          )}
        </div>
        {/* Right: save + share */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <SaveButton listingId={job?.listing_id} />
          <ShareButton title={job?.listing_title} />
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

      {/* Hero section */}
      <div
        style={{
          background: "#EEEDFE",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "12px",
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
          {job.is_urgent && (
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
          <span
            style={{
              background: "#fff",
              color: "#534AB7",
              fontSize: "11px",
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: "20px",
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

        {/* Company and location */}
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
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "14px" }}>
          📍 {job.listing_location}, {job.listing_state}
        </p>

        {/* Salary badge — full width on mobile */}
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
            Salary
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
            { label: "Job type", value: job.job_type?.replace("_", " ") },
            {
              label: "Experience",
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
                About the role
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
                Qualifications
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
              background: "#F5F4F0",
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
                Posted{" "}
                {new Date(job.created_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Divider */}
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
            Apply / Contact
          </h3>

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
                  Create a free account to apply for this job
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
            <ReportButton listingId={job?.listing_id} />
          </div>
        </div>
      </div>
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
