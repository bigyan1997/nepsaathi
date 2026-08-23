import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../../api/messages";
import useAuthStore from "../../store/authStore";
import { useToast } from "./Toast";
import { ChatDotsIcon } from "@phosphor-icons/react";

export default function MessageButton({ recipientId, listingId, listingTitle, listingType, compact = false, fullWidth = false }) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const isOwnListing = user?.id === recipientId;

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
      setShowModal(false);
      setMessage("");
      navigate(`/messages/${data.id}`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message
        || err?.response?.data?.detail
        || "Failed to send message.";
      addToast(msg, "error");
    },
  });

  if (isOwnListing) return null;

  const handleClick = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setShowModal(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: fullWidth ? "center" : "flex-start",
          gap: "6px",
          width: fullWidth ? "100%" : undefined,
          background: fullWidth ? "#1B8F5E" : "#EEEDFE",
          border: fullWidth ? "none" : "0.5px solid #AFA9EC",
          borderRadius: "8px",
          padding: compact ? "9px 12px" : fullWidth ? "12px 16px" : "9px 16px",
          fontSize: "13px",
          fontWeight: fullWidth ? 600 : 500,
          color: fullWidth ? "#fff" : "#534AB7",
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = fullWidth ? "#157a50" : "#DDD9FC")}
        onMouseLeave={(e) => (e.currentTarget.style.background = fullWidth ? "#1B8F5E" : "#EEEDFE")}
      >
        <ChatDotsIcon size={15} weight="fill" color={fullWidth ? "#fff" : "#534AB7"} />
        {!compact && "Message"}
      </button>

      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 440 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#26215C", margin: "0 0 4px" }}>Send a message</h3>
            {listingTitle && (
              <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>Re: {listingTitle}</p>
            )}
            <form onSubmit={handleSend}>
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                maxLength={2000}
                style={{
                  width: "100%",
                  border: "1px solid #e0e0e0",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
              />
              <div style={{ fontSize: 11, color: "#aaa", textAlign: "right", margin: "4px 0 16px" }}>
                {message.length}/2000
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setMessage(""); }}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e0e0e0", background: "#F5F4F0", fontSize: 14, cursor: "pointer", color: "#555" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || mutation.isPending}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: 10,
                    border: "none",
                    background: "#534AB7",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: message.trim() && !mutation.isPending ? "pointer" : "not-allowed",
                    opacity: message.trim() && !mutation.isPending ? 1 : 0.5,
                  }}
                >
                  {mutation.isPending ? "Sending..." : "Send message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
