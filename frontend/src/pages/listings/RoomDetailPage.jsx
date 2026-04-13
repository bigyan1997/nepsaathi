import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoom } from "../../api/rooms";
import useAuthStore from "../../store/authStore";

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: () => getRoom(id),
  });

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
        Loading room...
      </div>
    );

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#A32D2D" }}>
        Room not found or has been removed.
      </div>
    );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px" }}>
      {/* Back button */}
      <button
        onClick={() => navigate("/rooms")}
        style={{
          background: "transparent",
          border: "none",
          color: "#E87722",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "20px",
          padding: 0,
        }}
      >
        ← Back to rooms
      </button>

      {/* Main card */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Thumb */}
        <div
          style={{
            height: "180px",
            background: "#FFF1E0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
          }}
        >
          🏠
        </div>

        <div style={{ padding: "28px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#26215C",
                  marginBottom: "4px",
                }}
              >
                {room.listing_title}
              </h1>
              <p style={{ fontSize: "14px", color: "#666" }}>
                {room.listing_location}, {room.listing_state}
              </p>
            </div>
            <div
              style={{
                background: "#FFF1E0",
                color: "#633806",
                fontSize: "18px",
                fontWeight: 600,
                padding: "6px 16px",
                borderRadius: "20px",
                whiteSpace: "nowrap",
              }}
            >
              {room.price_display}
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
                background: "#FFF1E0",
                color: "#633806",
                fontSize: "12px",
                fontWeight: 500,
                padding: "4px 12px",
                borderRadius: "10px",
              }}
            >
              {room.room_type?.replace("_", " ")}
            </span>
            {room.bills_included && (
              <span
                style={{
                  background: "#E1F5EE",
                  color: "#085041",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "10px",
                }}
              >
                Bills included
              </span>
            )}
            {room.nepalese_household && (
              <span
                style={{
                  background: "#EEEDFE",
                  color: "#3C3489",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "10px",
                }}
              >
                🇳🇵 Nepalese household
              </span>
            )}
            {room.pets_allowed && (
              <span
                style={{
                  background: "#F5F4F0",
                  color: "#666",
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "10px",
                }}
              >
                Pets allowed
              </span>
            )}
            {room.parking_available && (
              <span
                style={{
                  background: "#F5F4F0",
                  color: "#666",
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "10px",
                }}
              >
                Parking available
              </span>
            )}
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
              { label: "Room type", value: room.room_type?.replace("_", " ") },
              { label: "Weekly rent", value: room.price_display },
              { label: "Bond", value: room.bond?.replace("_", " ") },
              { label: "Furnishing", value: room.furnishing },
              { label: "Bedrooms", value: room.bedrooms },
              { label: "Bathrooms", value: room.bathrooms },
              { label: "Max occupants", value: room.max_occupants },
              { label: "Available from", value: room.available_from || "Now" },
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
            style={{ borderTop: "0.5px solid #e5e5e5", marginBottom: "24px" }}
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
            Contact landlord
          </h3>

          {isAuthenticated ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {room.contact_phone && (
                <a
                  href={`tel:${room.contact_phone}`}
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
                  Call {room.contact_phone}
                </a>
              )}
              {room.contact_whatsapp && (
                <a
                  href={`https://wa.me/${room.contact_whatsapp?.replace(/\D/g, "")}`}
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
