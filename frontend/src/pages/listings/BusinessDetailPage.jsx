import { useParams, useNavigate, Link } from "react-router-dom";
import { CameraIcon, SealCheckIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, GlobeIcon, CalendarCheckIcon, StorefrontIcon, ForkKnifeIcon, ShoppingCartIcon, AirplaneIcon, ScissorsIcon, FirstAidKitIcon, ScalesIcon, BookOpenIcon, SunIcon, HammerIcon, CarIcon, CurrencyDollarIcon, LaptopIcon, PushPinIcon } from "@phosphor-icons/react";
import { mapsUrl } from "../../utils/constants";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBusiness,
  getBusinessReviews,
  addBusinessReview,
  deleteBusinessReview,
  uploadBusinessImages,
  deleteBusinessImage,
} from "../../api/businesses";
import { getSimilarListings } from "../../api/listings";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageMeta from "../../hooks/usePageMeta";
import useIsMobile from "../../hooks/useIsMobile";
import { useToast } from "../../components/ui/Toast";
import WhatsAppButton from "../../components/ui/WhatsAppButton";
import JsonLd from "../../components/ui/JsonLd";
import ImageGallery from "../../components/ui/ImageGallery";

const CATEGORY_ICONS = {
  restaurant: ForkKnifeIcon,
  grocery: ShoppingCartIcon,
  travel: AirplaneIcon,
  beauty: ScissorsIcon,
  health: FirstAidKitIcon,
  legal: ScalesIcon,
  education: BookOpenIcon,
  religious: SunIcon,
  construction: HammerIcon,
  transport: CarIcon,
  finance: CurrencyDollarIcon,
  freelancer: LaptopIcon,
  retail: StorefrontIcon,
  other: PushPinIcon,
};

const CATEGORY_COLORS = {
  restaurant: { bg: "#FFF1E0", color: "#633806", border: "#EFD9C0" },
  grocery: { bg: "#E1F5EE", color: "#085041", border: "#9FE1CB" },
  travel: { bg: "#E6F1FB", color: "#0C447C", border: "#B5D4F4" },
  beauty: { bg: "#FBEAF0", color: "#4B1528", border: "#F4C0D1" },
  health: { bg: "#EAF3DE", color: "#27500A", border: "#C0DD97" },
  legal: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC" },
  education: { bg: "#E6F1FB", color: "#0C447C", border: "#B5D4F4" },
  religious: { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  construction: { bg: "#F1EFE8", color: "#444441", border: "#D3D1C7" },
  transport: { bg: "#E1F5EE", color: "#085041", border: "#9FE1CB" },
  finance: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC" },
  freelancer: { bg: "#FFF1E0", color: "#633806", border: "#EFD9C0" },
  retail: { bg: "#FAECE7", color: "#4A1B0C", border: "#F5C4B3" },
  other: { bg: "#F5F4F0", color: "#444441", border: "#D3D1C7" },
};

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
const IconGlobe = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange?.(star)}
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
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const isMobile = useIsMobile();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const imageInputRef = useRef(null);

  const {
    data: business,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["business", slug],
    queryFn: () => getBusiness(slug),
  });

  // Businesses are not backed by a Listing model so there is no listing_id to query similar listings with

  const { data: reviews = [] } = useQuery({
    queryKey: ["business-reviews", slug],
    queryFn: () => getBusinessReviews(slug),
  });

  const addReviewMutation = useMutation({
    mutationFn: (data) => addBusinessReview(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", slug] });
      queryClient.invalidateQueries({ queryKey: ["business", slug] });
      setReviewRating(0);
      setReviewComment("");
      addToast("Review submitted!", "success");
    },
    onError: (err) =>
      addToast(
        err?.response?.data?.detail || "Failed to submit review.",
        "error",
      ),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => deleteBusinessReview(slug, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-reviews", slug] });
      queryClient.invalidateQueries({ queryKey: ["business", slug] });
      addToast("Review deleted.", "info");
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (formData) => uploadBusinessImages(slug, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", slug] });
      addToast("Photos uploaded!", "success");
    },
    onError: (err) =>
      addToast(err?.response?.data?.detail || "Upload failed.", "error"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => deleteBusinessImage(slug, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", slug] });
      addToast("Photo removed.", "info");
    },
    onError: () => addToast("Failed to remove photo.", "error"),
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    uploadImagesMutation.mutate(fd);
    e.target.value = "";
  };

  usePageMeta(
    business?.business_name ? `${business.business_name} — Business` : null,
    business?.description,
    business?.images?.[0]?.thumbnail || business?.images?.[0]?.image,
  );

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Business not found or has been removed.
      </div>
    );

  const catColor = CATEGORY_COLORS[business?.category] || CATEGORY_COLORS.other;
  const BizCatIcon = CATEGORY_ICONS[business?.category] || PushPinIcon;
  const footerBg = "#8B5E00";
  const hasReviewed = reviews.some((r) => r.is_own_review);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business.business_name,
        "description": business.description,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": business.address || business.suburb,
          "addressLocality": business.suburb,
          "addressRegion": business.state,
          "postalCode": business.postcode,
          "addressCountry": "AU",
        },
        ...(business.phone && { "telephone": business.phone }),
        ...(business.website && { "url": business.website }),
        ...(business.avg_rating && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": business.avg_rating,
            "reviewCount": business.review_count,
          },
        }),
      }} />
      <style>{`
        .biz-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) { .biz-grid { grid-template-columns: 1fr !important; } }
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
          <Link to="/businesses" style={{ color: "#aaa", textDecoration: "none" }}>Businesses</Link>
          {business?.business_name && <><span>›</span><span style={{ color: "#534AB7", fontWeight: 500 }}>{business.business_name}</span></>}
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
            onClick={() => navigate("/businesses")}
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
            <IconBack /> Back to businesses
          </button>
          <ShareButton title={business?.business_name} compact={isMobile} />
        </div>

        {/* ── Image gallery ── */}
        {business.images?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <ImageGallery images={business.images.map((img) => ({ id: img.id, url: img.image }))} title={business.business_name} />
          </div>
        )}

        {/* ── Owner photo management strip ── */}
        {business.is_owner && (
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#555", flexShrink: 0 }}>
              <CameraIcon size={12} weight="fill" color="#555" style={{ verticalAlign: "middle", marginRight: "4px" }} />Photos ({business.images?.length || 0}/5)
            </span>
            {business.images?.map((img) => (
              <div key={img.id} style={{ position: "relative" }}>
                <img
                  src={img.thumbnail || img.image}
                  alt="Business photo thumbnail"
                  style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", border: "0.5px solid #e5e5e5" }}
                />
                <button
                  onClick={() => deleteImageMutation.mutate(img.id)}
                  style={{
                    position: "absolute", top: "-5px", right: "-5px",
                    background: "#E87722", border: "none", color: "#fff",
                    width: "16px", height: "16px", borderRadius: "50%",
                    fontSize: "9px", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {(business.images?.length || 0) < 5 && (
              <>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadImagesMutation.isPending}
                  style={{
                    background: "#EEEDFE", border: "1.5px dashed #AFA9EC",
                    color: "#534AB7", fontSize: "12px", fontWeight: 600,
                    padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {uploadImagesMutation.isPending ? "Uploading…" : "+ Add photos"}
                </button>
              </>
            )}
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
          {/* Logo block */}
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
            <BizCatIcon size={isMobile ? 26 : 36} weight="duotone" color={catColor.color} />
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
                <BizCatIcon size={11} weight="fill" color={catColor.color} style={{ marginRight: "4px", verticalAlign: "middle" }} />{business.category?.replace(/_/g, " ")}
              </span>
              {business.is_verified && (
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
                  <SealCheckIcon size={11} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} /> Verified
                </span>
              )}
              {business.is_nepalese_owned && (
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
                  🇳🇵 Nepalese owned
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
              {business.business_name}
            </h1>
            {business.avg_rating > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <StarRating value={Math.round(business.avg_rating)} size={16} />
                <span
                  style={{
                    fontSize: "13px",
                    color: catColor.color,
                    fontWeight: 600,
                  }}
                >
                  {business.avg_rating} · {business.review_count} review
                  {business.review_count !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <span
              style={{
                fontSize: "14px",
                color: catColor.color,
                fontWeight: 600,
              }}
            >
              <a
                href={mapsUrl([business.suburb, business.state, "Australia"].filter(Boolean).join(", "))}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <MapPinIcon size={14} weight="fill" color="#E87722" style={{ flexShrink: 0 }} />{business.suburb}, {business.state}
              </a>
            </span>
          </div>
        </div>

        {/* ── Two-col grid ── */}
        <div className="biz-grid">
          {/* LEFT */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* About */}
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
                  About this business
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#444",
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  {business.description}
                </p>
              </div>
            </div>

            {/* Business details — category tinted */}
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
                  Business details
                </h3>
              </div>
              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {[
                  business.address && {
                    label: "Address",
                    value: business.address,
                  },
                  {
                    label: "Location",
                    value: `${business.suburb}, ${business.state}${business.postcode ? ` ${business.postcode}` : ""}`,
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
                      {isLink ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "13px",
                            color: "#534AB7",
                            fontWeight: 600,
                            wordBreak: "break-all",
                          }}
                        >
                          {value.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ) : (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#26215C",
                            fontWeight: 600,
                          }}
                        >
                          {value}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Reviews */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#26215C",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
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
                  Reviews
                </h2>
                {business?.review_count > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <StarRating
                      value={Math.round(business.avg_rating)}
                      size={13}
                    />
                    <span style={{ fontSize: "12px", color: "#AFA9EC" }}>
                      {business.avg_rating} ({business.review_count})
                    </span>
                  </div>
                )}
              </div>
              <div style={{ padding: "20px" }}>
                {/* Write review */}
                {isAuthenticated && !business?.is_owner && !hasReviewed && (
                  <div
                    style={{
                      background: "#F5F4F0",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#26215C",
                        marginBottom: "10px",
                      }}
                    >
                      Leave a review
                    </div>
                    <StarRating
                      value={reviewRating}
                      onChange={setReviewRating}
                      size={24}
                    />
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
                        if (!reviewRating) {
                          addToast("Please select a star rating.", "error");
                          return;
                        }
                        addReviewMutation.mutate({
                          rating: reviewRating,
                          comment: reviewComment,
                        });
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
                        cursor: addReviewMutation.isPending
                          ? "not-allowed"
                          : "pointer",
                        opacity: addReviewMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {addReviewMutation.isPending
                        ? "Submitting…"
                        : "Submit review"}
                    </button>
                  </div>
                )}

                {!isAuthenticated && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#888",
                      marginBottom: "16px",
                    }}
                  >
                    <Link
                      to="/login"
                      style={{ color: "#534AB7", fontWeight: 500 }}
                    >
                      Sign in
                    </Link>{" "}
                    to leave a review.
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>
                    No reviews yet. Be the first!
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        style={{
                          borderTop: "0.5px solid #f0f0f0",
                          paddingTop: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#26215C",
                                }}
                              >
                                {review.reviewer_name}
                              </span>
                              <StarRating value={review.rating} size={13} />
                            </div>
                            {review.comment && (
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#555",
                                  lineHeight: 1.6,
                                  margin: 0,
                                }}
                              >
                                {review.comment}
                              </p>
                            )}
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#aaa",
                                margin: "4px 0 0",
                              }}
                            >
                              {new Date(review.created_at).toLocaleDateString(
                                "en-AU",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          {review.is_own_review && (
                            <button
                              onClick={() =>
                                deleteReviewMutation.mutate(review.id)
                              }
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
          </div>

          {/* RIGHT sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Category card */}
            <div
              style={{
                background: catColor.bg,
                border: `1.5px solid ${catColor.border}`,
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <BizCatIcon size={32} weight="duotone" color={catColor.color} />
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: catColor.color,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                }}
              >
                Category
              </div>
              <div
                style={{ fontSize: "15px", fontWeight: 700, color: "#26215C" }}
              >
                {business.category?.replace(/_/g, " ")}
              </div>
              {business.established_year && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: catColor.color,
                    fontWeight: 500,
                  }}
                >
                  Est. {business.established_year}
                </div>
              )}
            </div>

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
                      href={mapsUrl([business.suburb, business.state, "Australia"].filter(Boolean).join(", "))}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {business.suburb}, {business.state}
                    </a>
                  </span>
                </div>
                {business.operating_hours && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: catColor.color,
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
                      {business.operating_hours}
                    </span>
                  </div>
                )}
                {business.website && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: catColor.color,
                    }}
                  >
                    <IconGlobe />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "13px",
                        color: "#534AB7",
                        fontWeight: 500,
                        textDecoration: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {business.website
                        .replace(/^https?:\/\//, "")
                        .replace(/\/$/, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
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
                  CONTACT
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
                    {business.phone && (
                      <a
                        href={`tel:${business.phone}`}
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
                        <PhoneIcon size={13} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />Call {business.phone}
                      </a>
                    )}
                    {business.whatsapp && (
                      <WhatsAppButton phone={business.whatsapp} listingTitle={business.business_name} size="small" />
                    )}
                    {business.email && (
                      <a
                        href={`mailto:${business.email}`}
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
                        <EnvelopeIcon size={13} weight="regular" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />Email
                      </a>
                    )}
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "#EEEDFE",
                          color: "#534AB7",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        <GlobeIcon size={13} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />Visit website
                      </a>
                    )}
                    {business.booking_link && (
                      <a
                        href={business.booking_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "#f0fdf4",
                          color: "#15803d",
                          border: "1.5px solid #bbf7d0",
                          padding: "10px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        <CalendarCheckIcon size={13} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />Book / Make Appointment
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
                      Sign in to view contact details
                    </p>
                    <Link
                      to="/login"
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
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <ReportButton endpoint={`/api/businesses/${business?.slug}/report/`} />
            </div>
          </div>
        </div>

        {/* ── Similar businesses ── */}
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
                Similar businesses
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
                  to={`/businesses/${listing.slug}`}
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
                      background: "#FAEEDA",
                      border: "0.5px solid #FAC775",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <StorefrontIcon size={20} weight="duotone" color="#E87722" />
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
