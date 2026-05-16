import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startConversation } from "../../api/messages";
import useAuthStore from "../../store/authStore";
import { useToast } from "./Toast";
import VerifiedBadge from "./VerifiedBadge";

const DEFAULT_MESSAGE = "Hi, I'm interested in this listing. Is it available?";

export default function GetInTouchSection({
  recipientId,
  listingId,
  listingTitle,
  listingType,
  postedBy,
  isVerified = false,
  joinedDate,
  themeColor = "#534AB7",
}) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const isOwn = user?.id === recipientId;
  const initial = postedBy?.[0]?.toUpperCase() || "?";

  const joinedLabel = joinedDate
    ? `Member since ${new Date(joinedDate).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}`
    : null;

  const mutation = useMutation({
    mutationFn: () => startConversation({
      recipient_id: recipientId,
      listing_id: listingId || null,
      listing_title: listingTitle || "",
      listing_type: listingType || "",
      message: message.trim(),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      navigate(`/messages/${data.id}`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message
        || err?.response?.data?.detail
        || "Failed to send message.";
      addToast(msg, "error");
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || mutation.isPending) return;
    mutation.mutate();
  };

  if (isOwn) return null;

  return (
    <div style={{ marginTop: "24px" }}>
      <style>{`
        .git-grid { display: grid; grid-template-columns: 220px 1fr; }
        .git-left { border-right: 0.5px solid #e5e5e5; border-bottom: none; }
        @media (max-width: 600px) {
          .git-grid { grid-template-columns: 1fr; }
          .git-left { border-right: none; border-bottom: 0.5px solid #e5e5e5; padding: 20px 16px !important; }
        }
      `}</style>
      <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#26215C", marginBottom: "14px" }}>
        Get in touch
      </h2>
      <div
        className="git-grid"
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Left: seller info */}
        <div
          className="git-left"
          style={{
            background: "#F8F7FF",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: themeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#26215C", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
              {postedBy || "Poster"}
              {isVerified && <VerifiedBadge size={15} />}
            </div>
            {joinedLabel && (
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                {joinedLabel}
              </div>
            )}
            {recipientId && (
              <Link
                to={`/users/${recipientId}`}
                style={{ fontSize: "12px", color: "#534AB7", fontWeight: 600, textDecoration: "none", marginTop: "8px", display: "inline-block" }}
              >
                View profile →
              </Link>
            )}
          </div>
        </div>

        {/* Right: message form */}
        <div style={{ padding: "24px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", margin: "0 0 12px" }}>
            Ask about this listing
          </p>
          {isAuthenticated ? (
            <form onSubmit={handleSend}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                style={{
                  width: "100%",
                  border: "0.5px solid #ddd",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                  color: "#333",
                }}
              />
              <button
                type="submit"
                disabled={!message.trim() || mutation.isPending}
                style={{
                  marginTop: "12px",
                  background: mutation.isPending || !message.trim() ? "#ccc" : "#1B8F5E",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: mutation.isPending || !message.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>✈️</span>
                {mutation.isPending ? "Sending..." : "Send message"}
              </button>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px", lineHeight: 1.5 }}>
                Sign in to message the poster directly.
              </p>
              <Link
                to="/login"
                style={{
                  display: "inline-block",
                  background: "#1B8F5E",
                  color: "#fff",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Sign in to message →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
