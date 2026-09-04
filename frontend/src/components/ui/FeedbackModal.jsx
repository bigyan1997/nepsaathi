import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../../utils/axios";
import { markShown } from "../../hooks/useExitIntent";
import { useToast } from "./Toast";

const SATISFACTION = [
  { value: 1, emoji: "😞", label: "Very bad" },
  { value: 2, emoji: "😕", label: "Not great" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Love it!" },
];

const REASONS = [
  { value: "just_browsing",          label: "Just browsing",                icon: "👀" },
  { value: "not_enough_listings",    label: "Not enough listings",          icon: "📋" },
  { value: "missing_feature",        label: "Missing a feature",            icon: "✨" },
  { value: "hard_to_navigate",       label: "Hard to navigate",             icon: "🧭" },
  { value: "technical_issue",        label: "Technical issue",              icon: "🐛" },
  { value: "other",                  label: "Something else",               icon: "💬" },
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

  const canSubmit = satisfaction && reason && !mutation.isPending;

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
          borderRadius: "18px",
          padding: "32px 28px 28px",
          maxWidth: "460px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute", top: "14px", right: "16px",
            background: "none", border: "none", fontSize: "20px",
            cursor: "pointer", color: "#bbb", lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#26215C", margin: "0 0 5px" }}>
            Quick feedback?
          </h2>
          <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>
            Takes 10 seconds and helps us improve for the community.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Satisfaction — emoji picker */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#555", display: "block", marginBottom: "14px" }}>
              How's your experience so far? <span style={{ color: "#e74c3c" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
              {SATISFACTION.map(({ value, emoji, label }) => {
                const active = satisfaction === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSatisfaction(value)}
                    title={label}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "5px",
                      padding: "10px 4px 8px",
                      borderRadius: "12px",
                      border: active ? "2px solid #534AB7" : "1.5px solid #eee",
                      background: active ? "#EEEDFE" : "#fafafa",
                      cursor: "pointer",
                      transition: "all 0.13s",
                    }}
                  >
                    <span style={{ fontSize: "22px", lineHeight: 1 }}>{emoji}</span>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: active ? 700 : 500,
                      color: active ? "#534AB7" : "#bbb",
                      lineHeight: 1,
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason — chip grid */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#555", display: "block", marginBottom: "10px" }}>
              What's your main reason for the visit? <span style={{ color: "#e74c3c" }}>*</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {REASONS.map(({ value, label, icon }) => {
                const active = reason === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReason(value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: active ? "2px solid #534AB7" : "1.5px solid #eee",
                      background: active ? "#EEEDFE" : "#fafafa",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.13s",
                    }}
                  >
                    <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                    <span style={{
                      fontSize: "12.5px",
                      fontWeight: active ? 700 : 500,
                      color: active ? "#534AB7" : "#555",
                      lineHeight: 1.3,
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "none", border: "none",
                color: "#999", fontSize: "13.5px", fontWeight: 500,
                cursor: "pointer", padding: "10px 14px",
              }}
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? "#26215C" : "#e5e5ea",
                color: canSubmit ? "#fff" : "#aaa",
                border: "none",
                borderRadius: "10px",
                padding: "10px 28px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              {mutation.isPending ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
