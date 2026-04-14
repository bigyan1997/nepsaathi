import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJob, getJobByListing } from "../../api/jobs";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";

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
      {/* Back button */}
      <button
        onClick={() => navigate("/jobs")}
        style={{
          background: "transparent",
          border: "none",
          color: "#534AB7",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "20px",
          padding: 0,
        }}
      >
        ← Back to jobs
      </button>

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
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            {job.is_urgent && (
              <span
                style={{
                  background: "#FCEBEB",
                  color: "#A32D2D",
                  fontSize: "10px",
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  display: "inline-block",
                }}
              >
                Urgent
              </span>
            )}
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#26215C",
                marginBottom: "4px",
              }}
            >
              {job.listing_title}
            </h1>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {job.company_name} · {job.listing_location}, {job.listing_state}
            </p>
          </div>
          <div
            style={{
              background: "#EEEDFE",
              color: "#3C3489",
              fontSize: "15px",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
            }}
          >
            {job.salary_display}
          </div>
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: "#EEEDFE",
              color: "#534AB7",
              fontSize: "12px",
              fontWeight: 500,
              padding: "4px 12px",
              borderRadius: "10px",
            }}
          >
            {job.job_type?.replace("_", " ")}
          </span>
          <span
            style={{
              background: "#F5F4F0",
              color: "#666",
              fontSize: "12px",
              padding: "4px 12px",
              borderRadius: "10px",
            }}
          >
            Posted by {job.posted_by}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "24px" }}
        />

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            { label: "Job type", value: job.job_type?.replace("_", " ") },
            { label: "Salary", value: job.salary_display },
            {
              label: "Experience",
              value: job.experience_required || "Not specified",
            },
            {
              label: "Location",
              value: `${job.listing_location}, ${job.listing_state}`,
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#aaa",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

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
          </>
        )}

        {/* Divider */}
        <div
          style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "24px" }}
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
          Contact
        </h3>

        {isAuthenticated ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {job.contact_phone && (
              <a
                href={`tel:${job.contact_phone}`}
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
                Call {job.contact_phone}
              </a>
            )}
            {job.contact_whatsapp && (
              <a
                href={`https://wa.me/${job.listing_contact_whatsapp?.replace(/\D/g, "")}`}
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
            {job.contact_email && (
              <a
                href={`mailto:${job.contact_email}`}
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
      </div>
    </div>
  );
}
