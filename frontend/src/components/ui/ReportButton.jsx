import { useState } from "react";
import { useToast } from "./Toast";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axios";

const REASONS = [
  { value: "spam", label: "Spam or duplicate" },
  { value: "fake", label: "Fake or misleading" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "scam", label: "Scam or fraud" },
  { value: "wrong_category", label: "Wrong category" },
  { value: "other", label: "Other" },
];

export default function ReportButton({ listingId }) {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/listings/${listingId}/report/`, { reason, details });
      setSubmitted(true);
      addToast("Report submitted. Thank you! 🙏", "success");
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to submit report.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (!isAuthenticated) {
            navigate("/login");
            return;
          }
          setOpen(true);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#aaa",
          fontSize: "12px",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#A32D2D")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
      >
        🚩 Report
      </button>

      {/* Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 200,
            }}
          />

          {/* Modal box */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "420px",
              zIndex: 201,
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🙏</div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#26215C",
                    marginBottom: "8px",
                  }}
                >
                  Thank you!
                </h3>
                <p style={{ fontSize: "14px", color: "#888" }}>
                  Your report has been submitted. Our team will review it
                  shortly.
                </p>
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#26215C",
                    marginBottom: "6px",
                  }}
                >
                  🚩 Report this listing
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "20px",
                  }}
                >
                  Help us keep NepSaathi safe. Our admin team will review your
                  report.
                </p>

                {/* Reason */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#444",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Reason *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: "100%",
                      border: "0.5px solid #ccc",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      outline: "none",
                      background: "#fff",
                    }}
                  >
                    {REASONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Details */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#444",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Additional details (optional)
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell us more about why you're reporting this listing..."
                    maxLength={500}
                    style={{
                      width: "100%",
                      border: "0.5px solid #ccc",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      outline: "none",
                      minHeight: "90px",
                      resize: "vertical",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#aaa",
                      marginTop: "4px",
                    }}
                  >
                    {details.length}/500
                  </p>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      flex: 1,
                      background: "#fff",
                      color: "#555",
                      border: "0.5px solid #ccc",
                      borderRadius: "8px",
                      padding: "11px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      flex: 2,
                      background: loading ? "#ccc" : "#A32D2D",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "11px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Submitting..." : "Submit report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
