import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBusiness } from "../../api/businesses";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";

const CATEGORY_EMOJIS = {
  restaurant: "🍛",
  grocery: "🛒",
  travel: "✈️",
  beauty: "💇",
  health: "🏥",
  legal: "⚖️",
  education: "📚",
  religious: "🙏",
  construction: "🔨",
  transport: "🚗",
  finance: "💸",
  freelancer: "🧑‍💻",
  retail: "🏪",
  other: "📌",
};

const CATEGORY_COLORS = {
  restaurant: { bg: "#FFF1E0", color: "#633806" },
  grocery: { bg: "#E1F5EE", color: "#085041" },
  travel: { bg: "#E6F1FB", color: "#0C447C" },
  beauty: { bg: "#FBEAF0", color: "#4B1528" },
  health: { bg: "#EAF3DE", color: "#27500A" },
  legal: { bg: "#EEEDFE", color: "#3C3489" },
  education: { bg: "#E6F1FB", color: "#0C447C" },
  religious: { bg: "#FAEEDA", color: "#633806" },
  construction: { bg: "#F1EFE8", color: "#444441" },
  transport: { bg: "#E1F5EE", color: "#085041" },
  finance: { bg: "#EEEDFE", color: "#3C3489" },
  freelancer: { bg: "#FFF1E0", color: "#633806" },
  retail: { bg: "#FAECE7", color: "#4A1B0C" },
  other: { bg: "#F1EFE8", color: "#444441" },
};

export default function BusinessDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const {
    data: business,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusiness(id),
  });

  if (isLoading) return <SkeletonDetailPage />;

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Business not found or has been removed.
      </div>
    );

  const catColor = CATEGORY_COLORS[business?.category] || CATEGORY_COLORS.other;
  const catEmoji = CATEGORY_EMOJIS[business?.category] || "📌";

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px" }}>
      {/* Back button and share */}
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
        <ShareButton title={job?.listing_title} />
      </div>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Header banner */}
        <div
          style={{
            background: catColor.bg,
            padding: "28px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "14px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              flexShrink: 0,
            }}
          >
            {catEmoji}
          </div>
          <div>
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "8px",
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
                  border: `0.5px solid ${catColor.color}22`,
                }}
              >
                {catEmoji} {business.category?.replace("_", " ")}
              </span>
              {business.is_verified && (
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
                  ✓ Verified by NepSaathi
                </span>
              )}
              {business.is_nepalese_owned && (
                <span
                  style={{
                    background: "#EEEDFE",
                    color: "#3C3489",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "8px",
                  }}
                >
                  🇳🇵 Nepalese owned
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
              {business.business_name}
            </h1>
            <p style={{ fontSize: "14px", color: catColor.color }}>
              📍 {business.suburb}, {business.state}
            </p>
          </div>
        </div>

        <div style={{ padding: "28px" }}>
          {/* About */}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "8px",
            }}
          >
            About
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#555",
              lineHeight: 1.7,
              marginBottom: "24px",
            }}
          >
            {business.description}
          </p>

          {/* Divider */}
          <div
            style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
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
              business.address && { label: "Address", value: business.address },
              {
                label: "Location",
                value: `${business.suburb}, ${business.state} ${business.postcode}`,
              },
              business.established_year && {
                label: "Established",
                value: business.established_year,
              },
              business.operating_hours && {
                label: "Hours",
                value: business.operating_hours,
              },
              business.website && {
                label: "Website",
                value: business.website,
                isLink: true,
              },
            ]
              .filter(Boolean)
              .map(({ label, value, isLink }) => (
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
                  {isLink ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "14px",
                        color: "#534AB7",
                        fontWeight: 500,
                      }}
                    >
                      {value}
                    </a>
                  ) : (
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#333",
                        fontWeight: 500,
                      }}
                    >
                      {value}
                    </div>
                  )}
                </div>
              ))}
          </div>

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
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
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
                  Call {business.phone}
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp?.replace(/\D/g, "")}`}
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
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
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
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#EEEDFE",
                    color: "#534AB7",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Visit website
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
    </div>
  );
}
