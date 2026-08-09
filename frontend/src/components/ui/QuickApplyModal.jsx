import { useState } from "react";
import { applyToJob } from "../../api/jobs";
import { useToast } from "./Toast";

export default function QuickApplyModal({ job, onClose, onApplied }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const remaining = 2000 - coverLetter.length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!coverLetter.trim()) return;
    setLoading(true);
    try {
      await applyToJob(job.id, coverLetter.trim());
      addToast(
        "Application sent! The poster will be notified by email.",
        "success",
      );
      onApplied();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.cover_letter?.[0] ||
        err?.response?.data?.detail ||
        "Failed to submit application.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#26215C",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
              Quick Apply
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#AFA9EC",
                marginTop: "2px",
                maxWidth: "360px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {job.listing_title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#AFA9EC",
              cursor: "pointer",
              fontSize: "22px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <p
            style={{
              fontSize: "13px",
              color: "#666",
              margin: "0 0 16px",
              lineHeight: 1.6,
            }}
          >
            Your name, email, and phone (from your profile) will be shared with
            the poster alongside your message.
          </p>

          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#534AB7",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Cover letter / message
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            maxLength={2000}
            rows={7}
            placeholder="Introduce yourself and explain why you're a good fit for this role..."
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
              color: "#26215C",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#534AB7")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          <div
            style={{
              fontSize: "11px",
              color: remaining < 100 ? "#e87722" : "#aaa",
              textAlign: "right",
              marginTop: "4px",
            }}
          >
            {remaining} characters remaining
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                background: "#f5f5f5",
                color: "#555",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !coverLetter.trim()}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background:
                  loading || !coverLetter.trim() ? "#AFA9EC" : "#534AB7",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor:
                  loading || !coverLetter.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending…" : "Send Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
