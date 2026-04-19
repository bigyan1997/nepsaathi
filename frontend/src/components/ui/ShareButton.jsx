import { useState } from "react";
import { useToast } from "./Toast";

export default function ShareButton({ title, url, compact = false }) {
  const [open, setOpen] = useState(false);
  const { addToast } = useToast();

  const shareUrl = url || window.location.href;
  const shareTitle = title || "Check this out on NepSaathi!";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast("Link copied to clipboard!", "success");
      setOpen(false);
    } catch {
      addToast("Failed to copy link.", "error");
    }
  };

  const SHARE_OPTIONS = [
    {
      label: "WhatsApp",
      emoji: "💬",
      color: "#25D366",
      bg: "#E8F9EE",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
    },
    {
      label: "Facebook",
      emoji: "📘",
      color: "#1877F2",
      bg: "#E8F0FE",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Twitter/X",
      emoji: "🐦",
      color: "#000",
      bg: "#F0F0F0",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Email",
      emoji: "✉️",
      color: "#E87722",
      bg: "#FFF1E0",
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`,
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "#F5F4F0",
          border: "0.5px solid #e5e5e5",
          borderRadius: "8px",
          padding: compact ? "9px 12px" : "9px 16px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#555",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#EEEDFE")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F4F0")}
      >
        <span>🔗</span>
        {!compact && "Share"}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 98,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "12px",
              padding: "8px",
              minWidth: "200px",
              zIndex: 99,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#aaa",
                padding: "4px 8px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              Share this listing
            </p>

            {SHARE_OPTIONS.map(({ label, emoji, color, bg, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  color: "#333",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = bg)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span style={{ fontSize: "16px" }}>{emoji}</span>
                <span style={{ fontWeight: 500 }}>{label}</span>
              </a>
            ))}

            <div
              style={{ borderTop: "0.5px solid #f0f0f0", margin: "4px 0" }}
            />

            <button
              onClick={handleCopyLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#333",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                transition: "background 0.1s",
                fontWeight: 500,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F5F4F0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "16px" }}>📋</span>
              Copy link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
