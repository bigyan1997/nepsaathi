import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../../utils/axios";
import { markShown } from "../../hooks/useExitIntent";
import { useToast } from "./Toast";

const REASONS = [
  { value: "not_enough_listings", label: "Not enough listings in my area" },
  { value: "hard_to_navigate", label: "Hard to navigate" },
  { value: "just_browsing", label: "Just browsing" },
  { value: "missing_feature", label: "Missing a feature" },
  { value: "technical_issue", label: "Technical issue" },
  { value: "other", label: "Other" },
];

export default function FeedbackModal({ onClose }) {
  const [satisfaction, setSatisfaction] = useState(null);
  const [reason, setReason] = useState("");
  const { addToast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/api/feedback/", {
        satisfaction,
        reason,
        page_url: window.location.pathname,
      }),
    onSuccess: () => {
      markShown();
      addToast("Thanks for your feedback!", "success");
      onClose();
    },
    onError: () => {
      addToast("Failed to submit feedback.", "error");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!satisfaction || !reason) return;
    mutation.mutate();
  };

  const handleClose = () => {
    markShown();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px 28px",
          maxWidth: "460px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute", top: "14px", right: "16px",
            background: "none", border: "none", fontSize: "20px",
            cursor: "pointer", color: "#888", lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#26215C", margin: "0 0 6px" }}>
          We'd love your feedback!
        </h2>
        <p style={{ fontSize: "13px", color: "#888", margin: "0 0 24px" }}>
          Help us improve NepSaathi for the community.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Satisfaction */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#333", display: "block", marginBottom: "12px" }}>
              Overall, how satisfied are you with the website? <span style={{ color: "#e74c3c" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSatisfaction(n)}
                  style={{
                    width: "44px", height: "44px",
                    borderRadius: "50%",
                    border: satisfaction === n ? "2px solid #534AB7" : "1.5px solid #ddd",
                    background: satisfaction === n ? "#534AB7" : "#fff",
                    color: satisfaction === n ? "#fff" : "#555",
                    fontSize: "15px", fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#333", display: "block", marginBottom: "8px" }}>
              What's your main reason for leaving our site? <span style={{ color: "#e74c3c" }}>*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "14px",
                color: reason ? "#333" : "#aaa",
                background: "#fff",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: "36px",
              }}
            >
              <option value="" disabled>Please select</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Privacy note */}
          <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 20px", lineHeight: 1.5 }}>
            Your responses will be used in accordance with our{" "}
            <a href="/privacy" style={{ color: "#534AB7" }}>privacy policy</a>.
          </p>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "none", border: "none",
                color: "#555", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", padding: "10px 16px",
                textDecoration: "underline",
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!satisfaction || !reason || mutation.isPending}
              style={{
                background: !satisfaction || !reason ? "#ccc" : "#26215C",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 28px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: !satisfaction || !reason ? "not-allowed" : "pointer",
              }}
            >
              {mutation.isPending ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
