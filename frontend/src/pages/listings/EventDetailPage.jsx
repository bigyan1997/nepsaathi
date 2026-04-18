import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEvent, getEventByListing } from "../../api/events";
import useAuthStore from "../../store/authStore";
import { SkeletonDetailPage } from "../../components/ui/Skeleton";
import ShareButton from "../../components/ui/ShareButton";
import SaveButton from "../../components/ui/SaveButton";
import ReportButton from "../../components/ui/ReportButton";
import usePageTitle from "../../hooks/usePageTitle";
import { trackView } from "../../api/listings";
import { useEffect } from "react";

const CATEGORY_COLORS = {
  cultural: { bg: "#EEEDFE", color: "#3C3489" },
  sports: { bg: "#E1F5EE", color: "#085041" },
  food: { bg: "#FFF1E0", color: "#633806" },
  music: { bg: "#FBEAF0", color: "#4B1528" },
  religious: { bg: "#FAEEDA", color: "#633806" },
  community: { bg: "#E6F1FB", color: "#0C447C" },
  education: { bg: "#EAF3DE", color: "#27500A" },
  other: { bg: "#F1EFE8", color: "#444441" },
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isListingRoute = location.pathname.includes("/listing/");

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id, isListingRoute],
    queryFn: () => (isListingRoute ? getEventByListing(id) : getEvent(id)),
  });
  usePageTitle(
    event?.listing_title ? `${event.listing_title} — Event` : "Event",
  );
  useEffect(() => {
    if (event?.listing_id) {
      trackView(event.listing_id).catch(() => {});
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            onClick={() => navigate("/events")}
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
            ← Back to events
          </button>
          {event?.view_count > 0 && (
            <span
              style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}
            >
              👁️ {event.view_count} {event.view_count === 1 ? "view" : "views"}
            </span>
          )}
        </div>
        {/* Right: save + share */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <SaveButton listingId={event?.listing_id} />
          <ShareButton title={event?.listing_title} />
        </div>
      </div>

      {/* Under review banner */}
      {event?.is_under_review && (
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

      {/* Main card */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Hero date banner */}
        <div
          style={{
            background: "#EEEDFE",
            padding: "28px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "14px 18px",
              textAlign: "center",
              minWidth: "72px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 600,
                color: "#26215C",
                lineHeight: 1,
              }}
            >
              {new Date(event.event_date).getDate()}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#534AB7",
                fontWeight: 500,
                marginTop: "2px",
              }}
            >
              {new Date(event.event_date)
                .toLocaleDateString("en-AU", { month: "short" })
                .toUpperCase()}
            </div>
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
                }}
              >
                {event.category?.replace("_", " ")}
              </span>
              {event.is_free && (
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
                  Free
                </span>
              )}
              {event.is_online && (
                <span
                  style={{
                    background: "#E6F1FB",
                    color: "#0C447C",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "8px",
                  }}
                >
                  Online
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
              {event.listing_title}
            </h1>
            <p style={{ fontSize: "14px", color: "#534AB7" }}>
              {formatDate(event.event_date)} · {formatTime(event.event_date)}
            </p>
          </div>
        </div>

        <div style={{ padding: "28px" }}>
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
              { label: "Date", value: formatDate(event.event_date) },
              { label: "Time", value: formatTime(event.event_date) },
              event.event_end_date && {
                label: "Ends",
                value: `${formatDate(event.event_end_date)} ${formatTime(event.event_end_date)}`,
              },
              {
                label: "Location",
                value: event.is_online
                  ? "Online event"
                  : `${event.listing_location}, ${event.listing_state}`,
              },
              event.venue && { label: "Venue", value: event.venue },
              event.organiser && { label: "Organiser", value: event.organiser },
              { label: "Entry", value: event.ticket_display },
              event.max_attendees && {
                label: "Capacity",
                value: `${event.max_attendees} attendees`,
              },
            ]
              .filter(Boolean)
              .map(({ label, value }) => (
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
                  <div
                    style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}
                  >
                    {value}
                  </div>
                </div>
              ))}
          </div>

          {/* Divider */}
          <div
            style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "20px" }}
          />

          {/* Description */}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "8px",
            }}
          >
            About this event
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#555",
              lineHeight: 1.7,
              marginBottom: "24px",
            }}
          >
            {event.description}
          </p>

          {/* Event URL */}
          {event.event_url && (
            <>
              <div
                style={{
                  borderTop: "0.5px solid #e5e5e5",
                  marginBottom: "20px",
                }}
              />

              <a
                href={event.event_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  background: "#534AB7",
                  color: "#fff",
                  padding: "11px 24px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: "24px",
                }}
              >
                Register / Get tickets →
              </a>
            </>
          )}

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
            Contact organiser
          </h3>

          {isAuthenticated ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {event.contact_phone && (
                <a
                  href={`tel:${event.contact_phone}`}
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
                  Call {event.contact_phone}
                </a>
              )}
              {event.contact_whatsapp && (
                <a
                  href={`https://wa.me/${event.contact_whatsapp?.replace(/\D/g, "")}`}
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
              {event.contact_email && (
                <a
                  href={`mailto:${event.contact_email}`}
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

          {/* Report */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <ReportButton listingId={event?.listing_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
