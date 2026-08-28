import { useParams, useNavigate, Link } from "react-router-dom";
import { EyeIcon, WarningIcon, FlagIcon, MapPinIcon, ClockIcon, CheckCircleIcon, PhoneIcon, EnvelopeIcon, MaskHappyIcon, FootballIcon, ForkKnifeIcon, MusicNotesIcon, SunIcon, UsersIcon, BookOpenIcon, PushPinIcon } from "@phosphor-icons/react";
import { mapsUrl } from "../../utils/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventByListing, toggleRSVP } from "../../api/events";
import { getSimilarListings } from "../../api/listings";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import MessageButton from "../../components/ui/MessageButton";
import GetInTouchSection from "../../components/ui/GetInTouchSection";
import VerifiedBadge from "../../components/ui/VerifiedBadge";
import WhatsAppButton from "../../components/ui/WhatsAppButton";
import usePageMeta from "../../hooks/usePageMeta";
import { trackView } from "../../api/listings";
import { useEffect, useState } from "react";
import ImageGallery from "../../components/ui/ImageGallery";
import useIsMobile from "../../hooks/useIsMobile";
import JsonLd from "../../components/ui/JsonLd";

const CATEGORY_COLORS = {
  cultural: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC" },
  sports: { bg: "#E1F5EE", color: "#085041", border: "#9FE1CB" },
  food: { bg: "#FFF1E0", color: "#633806", border: "#EFD9C0" },
  music: { bg: "#FBEAF0", color: "#4B1528", border: "#F4C0D1" },
  religious: { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  community: { bg: "#E6F1FB", color: "#0C447C", border: "#B5D4F4" },
  education: { bg: "#EAF3DE", color: "#27500A", border: "#C0DD97" },
  other: { bg: "#F1EFE8", color: "#444441", border: "#D3D1C7" },
};

const CATEGORY_ICONS = {
  cultural: MaskHappyIcon,
  sports: FootballIcon,
  food: ForkKnifeIcon,
  music: MusicNotesIcon,
  religious: SunIcon,
  community: UsersIcon,
  education: BookOpenIcon,
  other: PushPinIcon,
};

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

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const formatDateShort = (d) =>
  new Date(d).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

/* ── small inline SVG icons ── */
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
const IconCal = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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
export default function EventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", slug],
    queryFn: () => getEventByListing(slug),
    staleTime: 0,
    gcTime: 0,
  });

  const { data: similarListings } = useQuery({
    queryKey: ["similar", event?.listing_id],
    queryFn: () => getSimilarListings(event?.listing_id),
    enabled: !!event?.listing_id,
    retry: false,
  });

  // Optimistic local state for RSVP so the UI responds instantly
  const [rsvpState, setRsvpState] = useState(null);

  useEffect(() => {
    if (event) {
      setRsvpState({
        rsvped: event.user_has_rsvp,
        rsvp_count: event.rsvp_count,
        spots_left: event.spots_left,
      });
    }
  }, [event]);

  const rsvpMutation = useMutation({
    mutationFn: () => toggleRSVP(event.id),
    onMutate: () => {
      // Optimistic update
      setRsvpState((prev) => {
        if (!prev) return prev;
        const willRsvp = !prev.rsvped;
        const delta = willRsvp ? 1 : -1;
        return {
          rsvped: willRsvp,
          rsvp_count: prev.rsvp_count + delta,
          spots_left:
            prev.spots_left !== null ? prev.spots_left - delta : null,
        };
      });
    },
    onSuccess: (data) => {
      setRsvpState(data);
      queryClient.invalidateQueries({ queryKey: ["event", slug] });
    },
    onError: () => {
      // Roll back on error
      setRsvpState({
        rsvped: event.user_has_rsvp,
        rsvp_count: event.rsvp_count,
        spots_left: event.spots_left,
      });
    },
  });

  usePageMeta(
    event?.listing_title ? `${event.listing_title} — Event` : null,
    event?.description,
    event?.images?.[0]?.url,
    !!error,
  );

  useEffect(() => {
    if (event?.listing_id) {
      trackView(event.listing_id)
        .then(() => queryClient.invalidateQueries({ queryKey: ["event", slug] }))
        .catch(() => {});
    }
  }, [event?.listing_id]);

  if (isLoading) return <SkeletonDetailPage />;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Event not found or has been removed.
      </div>
    );

  const catColor = CATEGORY_COLORS[event?.category] || CATEGORY_COLORS.other;
  const CatIcon = CATEGORY_ICONS[event?.category] || PushPinIcon;
  const eventDay = new Date(event.event_date).getDate();
  const eventMonth = new Date(event.event_date)
    .toLocaleDateString("en-AU", { month: "short" })
    .toUpperCase();
  const eventYear = new Date(event.event_date).getFullYear();

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.listing_title,
        "description": event.description,
        "startDate": event.event_date,
        ...(event.event_end_date && { "endDate": event.event_end_date }),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": event.is_online
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
        "location": event.is_online
          ? { "@type": "VirtualLocation", "url": event.event_url || window.location.href }
          : {
              "@type": "Place",
              "name": event.venue || event.listing_location,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": event.listing_location,
                "addressRegion": event.listing_state,
                "addressCountry": "AU",
              },
            },
        "organizer": { "@type": "Organization", "name": event.organiser || "NepSaathi" },
        "isAccessibleForFree": event.is_free,
        ...(event.ticket_price && !event.is_free && {
          "offers": {
            "@type": "Offer",
            "price": event.ticket_price,
            "priceCurrency": "AUD",
            "availability": "https://schema.org/InStock",
          },
        }),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nepsaathi.com" },
          { "@type": "ListItem", "position": 2, "name": "Events", "item": "https://www.nepsaathi.com/events" },
          { "@type": "ListItem", "position": 3, "name": event.listing_title },
        ],
      }} />
      <style>{`
        .evt-grid { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
        @media (max-width: 767px) {
          .evt-grid { grid-template-columns: 1fr !important; }
        }
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
          <Link to="/events" style={{ color: "#aaa", textDecoration: "none" }}>Events</Link>
          {event?.listing_title && <><span>›</span><span style={{ color: "#534AB7", fontWeight: 500 }}>{event.listing_title}</span></>}
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
            onClick={() => navigate("/events")}
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
            <IconBack /> Back to events
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {event?.view_count > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#666", background: "#f5f4f0", borderRadius: "20px", padding: "5px 10px", fontWeight: 500 }}>
                <EyeIcon size={13} weight="regular" style={{ flexShrink: 0 }} />
                {event.view_count} views
              </span>
            )}
            <MessageButton
              recipientId={event?.user_id}
              listingId={event?.listing_id}
              listingTitle={event?.listing_title}
              listingType="event"
              compact={isMobile}
            />
            <SaveButton listingId={event?.listing_id} compact={isMobile} />
            <ShareButton title={event?.listing_title} compact={isMobile} />
          </div>
        </div>

        {/* ── Under review (spam detection — owner only sees this) ── */}
        {event?.is_under_review && (
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
            <WarningIcon size={20} weight="fill" color="#633806" />
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#633806" }}
              >
                Your listing is pending review
              </div>
              <div
                style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
              >
                {event?.is_reported
                  ? "A user has reported this listing. Our team will review it within 24 hours."
                  : "A similar listing was detected. Our team will review and make it visible within 24 hours."
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Reported banner (visible to all) ── */}
        {!event?.is_under_review && event?.is_reported && (
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
            <FlagIcon size={20} weight="fill" color="#A32D2D" />
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
        {event?.images?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <ImageGallery images={event.images} title={event.listing_title} />
          </div>
        )}

        {/* ── Hero — full-width coloured banner ── */}
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
          {/* Big date pill */}
          <div
            style={{
              background: "#fff",
              border: `1.5px solid ${catColor.border}`,
              borderRadius: "16px",
              padding: isMobile ? "10px 14px" : "16px 20px",
              textAlign: "center",
              minWidth: isMobile ? "56px" : "80px",
              flexShrink: 0,
              boxShadow: `0 2px 0 ${catColor.border}`,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "28px" : "38px",
                fontWeight: 700,
                color: "#26215C",
                lineHeight: 1,
              }}
            >
              {eventDay}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: catColor.color,
                fontWeight: 700,
                marginTop: "4px",
                letterSpacing: "0.06em",
              }}
            >
              {eventMonth}
            </div>
            <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
              {eventYear}
            </div>
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
              <span
                style={{
                  background: "#fff",
                  color: catColor.color,
                  border: `1px solid ${catColor.border}`,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 12px",
                  borderRadius: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CatIcon size={11} weight="fill" color={catColor.color} style={{ flexShrink: 0 }} />{event.category?.replace("_", " ")}
              </span>
              {event.is_free && (
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
                  Free entry
                </span>
              )}
              {event.is_online && (
                <span
                  style={{
                    background: "#185FA5",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 12px",
                    borderRadius: "20px",
                  }}
                >
                  Online
                </span>
              )}
              {event.is_featured && (
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
            </div>
            <h1
              style={{
                fontSize: isMobile ? "19px" : "24px",
                fontWeight: 700,
                color: "#26215C",
                margin: "0 0 10px",
                lineHeight: 1.25,
              }}
            >
              {event.listing_title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: catColor.color,
                  fontWeight: 600,
                }}
              >
                {formatDate(event.event_date)}
              </span>
              <span style={{ color: catColor.border, fontSize: "14px" }}>
                ·
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: catColor.color,
                  fontWeight: 600,
                }}
              >
                {formatTime(event.event_date)}
              </span>
            </div>
            {event.created_at && (
              <div style={{ fontSize: "12px", color: "#999", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <ClockIcon size={12} weight="regular" color="#999" style={{ flexShrink: 0 }} />Posted {timeAgo(event.created_at)}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-col grid ── */}
        <div className="evt-grid">
          {/* LEFT column */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* About — dark purple header bar for impact */}
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
                    letterSpacing: "0.03em",
                  }}
                >
                  About this event
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#444",
                    lineHeight: 1.8,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {event.description}
                </p>
                {event.event_url && (
                  <a
                    href={event.event_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "18px",
                      background: "#534AB7",
                      color: "#fff",
                      padding: "11px 22px",
                      borderRadius: "10px",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Register / Get tickets →
                  </a>
                )}
              </div>
            </div>

            {/* Event details — category-coloured header */}
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
                  Event details
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
                    { label: "Date", value: formatDateShort(event.event_date) },
                    { label: "Time", value: formatTime(event.event_date) },
                    event.event_end_date && {
                      label: "Ends",
                      value: `${formatDateShort(event.event_end_date)} ${formatTime(event.event_end_date)}`,
                    },
                    {
                      label: "Location",
                      value: event.is_online
                        ? "Online"
                        : `${event.listing_location}, ${event.listing_state}`,
                    },
                    event.venue && { label: "Venue", value: event.venue },
                    event.organiser && {
                      label: "Organiser",
                      value: event.organiser,
                    },
                    { label: "Entry", value: event.ticket_display },
                    event.created_at && {
                      label: "Posted",
                      value: timeAgo(event.created_at),
                    },
                    event.max_attendees && {
                      label: "Capacity",
                      value:
                        rsvpState?.rsvp_count != null
                          ? `${rsvpState.rsvp_count} / ${event.max_attendees} attending`
                          : `${event.max_attendees} max`,
                    },
                  ]
                    .filter(Boolean)
                    .map(({ label, value }) => (
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
          </div>

          {/* RIGHT sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Date & time */}
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
                  DATE & TIME
                </div>
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
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
                  <IconCal />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#26215C",
                      fontWeight: 500,
                    }}
                  >
                    {formatDateShort(event.event_date)}
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
                    {formatTime(event.event_date)}
                    {event.event_end_date
                      ? ` – ${formatTime(event.event_end_date)}`
                      : ""}
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
                    {event.is_online ? (
                      "Online event"
                    ) : (
                      <a
                        href={mapsUrl(event.venue || [event.listing_location, event.listing_state, "Australia"].filter(Boolean).join(", "))}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {event.venue || `${event.listing_location}, ${event.listing_state}`}
                      </a>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket / price + RSVP */}
            {(() => {
              const isSoldOut =
                rsvpState?.spots_left !== null &&
                rsvpState?.spots_left !== undefined &&
                rsvpState.spots_left <= 0 &&
                !rsvpState.rsvped;
              const fillPct =
                event.max_attendees && rsvpState?.rsvp_count != null
                  ? Math.min(
                      100,
                      Math.round(
                        (rsvpState.rsvp_count / event.max_attendees) * 100
                      )
                    )
                  : null;
              const barColor =
                fillPct >= 85
                  ? "#E74C3C"
                  : fillPct >= 60
                  ? "#E87722"
                  : "#1D9E75";

              return (
                <div
                  style={{
                    background: event.is_free ? "#1D9E75" : "#534AB7",
                    borderRadius: "14px",
                    padding: "18px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 700,
                    }}
                  >
                    {event.is_free ? "Free event" : "Tickets"}
                  </div>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "12px",
                    }}
                  >
                    {event.ticket_display}
                  </div>

                  {/* Capacity bar — shown when max_attendees is set */}
                  {event.max_attendees && rsvpState && (
                    <div style={{ marginBottom: "12px" }}>
                      {isSoldOut && (
                        <div
                          style={{
                            background: "#E74C3C",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textAlign: "center",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            marginBottom: "8px",
                          }}
                        >
                          SOLD OUT
                        </div>
                      )}
                      <div
                        style={{
                          height: "6px",
                          background: "rgba(255,255,255,0.2)",
                          borderRadius: "99px",
                          overflow: "hidden",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${fillPct}%`,
                            background: isSoldOut
                              ? "#E74C3C"
                              : fillPct >= 85
                              ? "#FFB347"
                              : "#fff",
                            borderRadius: "99px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.85)",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {isSoldOut
                            ? "No spots remaining"
                            : fillPct >= 85
                            ? <><WarningIcon size={12} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "3px" }} />Almost full — {rsvpState.spots_left} left</>
                            : `${rsvpState.spots_left} spot${rsvpState.spots_left === 1 ? "" : "s"} left`}
                        </span>
                        <span style={{ opacity: 0.7 }}>
                          {rsvpState.rsvp_count} / {event.max_attendees}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* RSVP button — free events only */}
                  {event.is_free && event.is_upcoming && (
                    <>
                      {isAuthenticated ? (
                        <button
                          onClick={() => rsvpMutation.mutate()}
                          disabled={
                            rsvpMutation.isPending ||
                            (isSoldOut && !rsvpState?.rsvped)
                          }
                          style={{
                            display: "block",
                            width: "100%",
                            background: rsvpState?.rsvped
                              ? "rgba(255,255,255,0.15)"
                              : isSoldOut
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(255,255,255,0.25)",
                            color: "#fff",
                            padding: "10px 14px",
                            borderRadius: "9px",
                            border: rsvpState?.rsvped
                              ? "1px solid rgba(255,255,255,0.5)"
                              : "1px solid rgba(255,255,255,0.3)",
                            fontSize: "13px",
                            fontWeight: 600,
                            textAlign: "center",
                            cursor:
                              rsvpMutation.isPending ||
                              (isSoldOut && !rsvpState?.rsvped)
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              isSoldOut && !rsvpState?.rsvped ? 0.5 : 1,
                            transition: "background 0.15s",
                          }}
                        >
                          {rsvpMutation.isPending
                            ? "..."
                            : isSoldOut
                            ? "Sold out"
                            : rsvpState?.rsvped
                            ? <><CheckCircleIcon size={13} weight="fill" color="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }} />You're going — Cancel RSVP</>

                            : "RSVP — it's free"}
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          style={{
                            display: "block",
                            background: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            padding: "10px 14px",
                            borderRadius: "9px",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: 600,
                            textAlign: "center",
                            border: "1px solid rgba(255,255,255,0.3)",
                          }}
                        >
                          Sign in to RSVP
                        </Link>
                      )}
                    </>
                  )}

                  {/* External tickets link — paid events */}
                  {!event.is_free && event.event_url && (
                    <a
                      href={event.event_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        padding: "9px 14px",
                        borderRadius: "9px",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        textAlign: "center",
                        border: "1px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      Get tickets →
                    </a>
                  )}
                </div>
              );
            })()}

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
                  {event.posted_by?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#26215C", display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
                    <Link
                      to={`/users/${event.user_id}`}
                      style={{ color: "inherit", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {event.posted_by}
                    </Link>
                    {event.poster_is_verified && <VerifiedBadge size={14} />}
                  </div>
                  {event.user_joined && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                      Member since {new Date(event.user_joined).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <MessageButton
                  recipientId={event.user_id}
                  listingId={event.listing_id}
                  listingTitle={event.listing_title}
                  listingType="event"
                  fullWidth
                />
                {isAuthenticated && (
                  <>
                    {event.contact_phone && (
                      <a href={`tel:${event.contact_phone}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "#EEEDFE", color: "#534AB7", padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600, border: "0.5px solid #AFA9EC" }}>
                        <PhoneIcon size={13} weight="fill" color="currentColor" style={{ flexShrink: 0 }} />{event.contact_phone}
                      </a>
                    )}
                    {event.contact_whatsapp && (
                      <WhatsAppButton phone={event.contact_whatsapp} listingTitle={event.listing_title} size="small" />
                    )}
                    {event.contact_email && (
                      <a href={`mailto:${event.contact_email}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "#f5f5f5", color: "#555", padding: "10px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                        <EnvelopeIcon size={13} weight="regular" color="currentColor" style={{ flexShrink: 0 }} />Email
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Report — tucked inside sidebar, not floating */}
            <div style={{ textAlign: "center" }}>
              <ReportButton listingId={event?.listing_id} backPath="/events" />
            </div>
          </div>
        </div>

        {/* ── Get in touch ── */}
        <GetInTouchSection
          recipientId={event.user_id}
          listingId={event.listing_id}
          listingTitle={event.listing_title}
          listingType="event"
          postedBy={event.posted_by}
          isVerified={event.poster_is_verified}
          joinedDate={event.user_joined}
          themeColor="#534AB7"
          whatsapp={event.contact_whatsapp || event.contact_phone}
        />

        {/* ── Similar events ── */}
        {similarListings?.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            {/* Section header */}
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
                Similar events
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
                const d = new Date(listing.event_date || listing.created_at);
                return (
                  <Link
                    key={listing.id}
                    to={`/events/${listing.slug}`}
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
                        background: "#EEEDFE",
                        border: "0.5px solid #AFA9EC",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        textAlign: "center",
                        minWidth: "50px",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#26215C",
                          lineHeight: 1,
                        }}
                      >
                        {d.getDate()}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#534AB7",
                          fontWeight: 700,
                          marginTop: "2px",
                        }}
                      >
                        {d
                          .toLocaleDateString("en-AU", { month: "short" })
                          .toUpperCase()}
                      </div>
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
