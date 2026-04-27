import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusiness, getBusinessReviews, addBusinessReview, deleteBusinessReview } from "../../api/businesses";
import { getSimilarListings } from "../../api/listings";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import useIsMobile from "../../hooks/useIsMobile";
import { useToast } from "../../components/ui/Toast";

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

function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: size,
            cursor: onChange ? "pointer" : "default",
            color: star <= (hovered || value) ? "#E87722" : "#ddd",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function BusinessDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const isMobile = useIsMobile();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

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

  const { data: reviews = [] } = useQuery({
    queryKey: ["business-reviews", id],
    queryFn: () => getBusinessReviews(id),
  });

  const addReviewMutation = useMutation({
    mutationFn: (data) => addBusinessReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["business-reviews", id]);
      queryClient.invalidateQueries(["business", id]);
      setReviewRating(0);
      setReviewComment("");
      addToast("Review submitted!", "success");
    },
    onError: (err) => {
      addToast(err?.response?.data?.detail || "Failed to submit review.", "error");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => deleteBusinessReview(id, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries(["business-reviews", id]);
      queryClient.invalidateQueries(["business", id]);
      addToast("Review deleted.", "info");
    },
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

      {/* Reviews */}
      <div style={{ marginTop: "24px" }}>
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5e5e5",
            borderRadius: "14px",
            padding: "24px 28px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#26215C", margin: 0 }}>
              Reviews
            </h3>
            {business?.review_count > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <StarRating value={Math.round(business.avg_rating)} size={16} />
                <span style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>
                  {business.avg_rating} · {business.review_count} review{business.review_count !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Write a review */}
          {isAuthenticated && !business?.is_owner && (() => {
            const hasReviewed = reviews.some((r) => r.is_own_review);
            if (hasReviewed) return null;
            return (
              <div
                style={{
                  background: "#F5F4F0",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#26215C", marginBottom: "10px" }}>
                  Leave a review
                </div>
                <StarRating value={reviewRating} onChange={setReviewRating} size={24} />
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience (optional)"
                  maxLength={500}
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    border: "0.5px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "#333",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => {
                    if (!reviewRating) { addToast("Please select a star rating.", "error"); return; }
                    addReviewMutation.mutate({ rating: reviewRating, comment: reviewComment });
                  }}
                  disabled={addReviewMutation.isPending}
                  style={{
                    marginTop: "10px",
                    background: "#534AB7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 20px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: addReviewMutation.isPending ? "not-allowed" : "pointer",
                    opacity: addReviewMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {addReviewMutation.isPending ? "Submitting…" : "Submit review"}
                </button>
              </div>
            );
          })()}

          {!isAuthenticated && (
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
              <Link to="/login" style={{ color: "#534AB7", fontWeight: 500 }}>Sign in</Link> to leave a review.
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#aaa" }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    borderTop: "0.5px solid #f0f0f0",
                    paddingTop: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#26215C" }}>
                          {review.reviewer_name}
                        </span>
                        <StarRating value={review.rating} size={13} />
                      </div>
                      {review.comment && (
                        <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, margin: 0 }}>
                          {review.comment}
                        </p>
                      )}
                      <p style={{ fontSize: "11px", color: "#aaa", margin: "4px 0 0" }}>
                        {new Date(review.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {review.is_own_review && (
                      <button
                        onClick={() => deleteReviewMutation.mutate(review.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#aaa",
                          fontSize: "12px",
                          cursor: "pointer",
                          padding: "2px 6px",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
