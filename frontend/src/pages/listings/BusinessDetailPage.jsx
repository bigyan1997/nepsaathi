import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBusiness } from "../../api/businesses";
import { getSimilarListings } from "../../api/listings";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import useIsMobile from "../../hooks/useIsMobile";

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
  other: "🏪",
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
  other: { bg: "#F5F4F0", color: "#444441" },
};

const formatCategory = (cat) => {
  if (!cat) return "";
  return cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const truncateUrl = (url) => {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
};

export default function BusinessDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  const {
    data: business,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusiness(id),
  });

  const { data: similarListings } = useQuery({
    queryKey: ["similar", business?.listing_id],
    queryFn: () => getSimilarListings(business.listing_id),
    enabled: !!business?.listing_id,
  });

  usePageTitle(
    business?.business_name
      ? `${business.business_name} — Business`
      : "Business",
  );

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Business not found or has been removed.
      </div>
    );

  const catColor = CATEGORY_COLORS[business?.category] || CATEGORY_COLORS.other;
  const catEmoji = CATEGORY_EMOJIS[business?.category] || "🏪";

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
          onClick={() => navigate("/businesses")}
          style={{
            background: "transparent",
            border: "none",
            color: "#534AB7",
            fontSize: "13px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Back to Businesses
        </button>
        <ShareButton title={business?.business_name} compact={isMobile} />
      </div>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Hero banner */}
        <div
          style={{
            background: catColor.bg,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Logo */}
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
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {catEmoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
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
                  background: "rgba(255,255,255,0.7)",
                  color: catColor.color,
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "8px",
                }}
              >
                {catEmoji} {formatCategory(business.category)}
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

            {/* Name */}
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#26215C",
                marginBottom: "4px",
                lineHeight: 1.2,
              }}
            >
              {business.business_name}
            </h1>
            <p style={{ fontSize: "13px", color: catColor.color }}>
              📍 {business.suburb}, {business.state}
            </p>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
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

          <div
            style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
          />

          {/* Details grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {[
              business.address && { label: "ADDRESS", value: business.address },
              {
                label: "LOCATION",
                value:
                  `${business.suburb}, ${business.state} ${business.postcode || ""}`.trim(),
              },
              business.established_year && {
                label: "ESTABLISHED",
                value: business.established_year,
              },
              business.operating_hours && {
                label: "HOURS",
                value: business.operating_hours,
              },
              business.website && {
                label: "WEBSITE",
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
                        wordBreak: "break-all",
                      }}
                    >
                      {truncateUrl(value)}
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
                  href={"tel:" + business.phone}
                  style={{
                    background: "#534AB7",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📞 Call {business.phone}
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={
                    "https://wa.me/" + business.whatsapp?.replace(/\D/g, "")
                  }
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
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  💬 WhatsApp
                </a>
              )}
              {business.email && (
                <a
                  href={"mailto:" + business.email}
                  style={{
                    background: "#FFF1E0",
                    color: "#E87722",
                    padding: "10px 20px",
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
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  🌐 Visit website
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
                  Create a free account to contact this business
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
            <ReportButton listingId={business?.listing_id} />
          </div>
        </div>
      </div>

      {/* Similar businesses */}
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
            Similar businesses
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {similarListings.map((listing) => (
              <Link
                key={listing.id}
                to={"/businesses/" + listing.id}
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
                      background: "#FAEEDA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    🏪
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
