import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJob, getJobByListing } from "../../api/jobs";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";

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
            gap: "4px",
          }}
        >
          ← Back to jobs
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <SaveButton listingId={job?.listing_id} />
          <ShareButton title={job?.listing_title} />
        </div>
      </div>

      {/* Hero section */}
      <div
        style={{
          background: "#EEEDFE",
          borderRadius: "14px",
          padding: "28px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
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
              fontSize: "26px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "8px",
              lineHeight: 1.2,
            }}
          >
            {job.listing_title}
          </h1>

          {/* Company and location */}
          <p
            style={{
              fontSize: "15px",
              color: "#534AB7",
              marginBottom: "4px",
              fontWeight: 500,
            }}
          >
            {job.company_name || "Company not specified"}
          </p>
          <p style={{ fontSize: "13px", color: "#666" }}>
            📍 {job.listing_location}, {job.listing_state}
          </p>
        </div>

        {/* Salary badge */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #AFA9EC",
            borderRadius: "12px",
            padding: "14px 18px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#888",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Salary
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#26215C" }}>
            {job.salary_display}
          </div>
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
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

        <div style={{ padding: "24px" }}>
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
        </div>
      </div>
    </div>
  );
}
