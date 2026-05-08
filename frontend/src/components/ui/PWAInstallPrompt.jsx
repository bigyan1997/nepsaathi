import { useState, useCallback } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { useToast } from "./Toast";

// ── Inline SVG icons — no extra dependencies ──────────────────────────────────

function IconShare() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

// ── Colours matching NepSaathi brand ─────────────────────────────────────────

const BRAND = "#26215C";
const BRAND_LIGHT = "#3D3680";
const ACCENT = "#F5A623";
const BG = "#FFFFFF";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

// ── iOS step chip ─────────────────────────────────────────────────────────────

function IOSStep({ num, icon, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        background: "#F9F8FF",
        borderRadius: "8px",
        border: `1px solid #EDEDF8`,
      }}
    >
      <span
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: BRAND,
          color: "#fff",
          fontSize: "11px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      {icon}
      <span style={{ fontSize: "13px", color: "#374151", lineHeight: 1.3 }}>
        {text}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PWAInstallPrompt() {
  const { isVisible, deviceInfo, triggerInstall, dismiss } = usePWAInstall();
  const { addToast } = useToast();
  const [installing, setInstalling] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(
    (permanent = false) => {
      setExiting(true);
      setTimeout(() => dismiss(permanent), 260);
    },
    [dismiss],
  );

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    try {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        addToast("🎉 NepSaathi added to your home screen!", "success", 4000);
      }
    } finally {
      setInstalling(false);
    }
  }, [triggerInstall, addToast]);

  if (!isVisible) return null;

  const { isIOSSafari, isAndroid } = deviceInfo;

  return (
    <>
      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pwa-slide-down {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(24px); }
        }
        .pwa-card {
          animation: pwa-slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .pwa-card.exiting {
          animation: pwa-slide-down 0.26s ease-in forwards;
        }
        .pwa-install-btn:hover:not(:disabled) {
          background: ${BRAND_LIGHT} !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(38,33,92,0.35) !important;
        }
        .pwa-install-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .pwa-dismiss-btn:hover {
          background: #F3F4F6 !important;
        }
        .pwa-close-btn:hover {
          background: rgba(0,0,0,0.06) !important;
        }
      `}</style>

      <div
        className={`pwa-card${exiting ? " exiting" : ""}`}
        role="dialog"
        aria-label="Install NepSaathi app"
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9990,
          width: "min(340px, calc(100vw - 32px))",
          background: BG,
          borderRadius: "16px",
          boxShadow:
            "0 8px 32px rgba(38,33,92,0.16), 0 2px 8px rgba(0,0,0,0.08)",
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            height: "4px",
            background: `linear-gradient(90deg, ${BRAND} 0%, #5B52CC 100%)`,
          }}
        />

        <div style={{ padding: "16px 16px 20px" }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {/* App icon */}
            <img
              src="/icon-192.png"
              alt="NepSaathi"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(38,33,92,0.2)",
              }}
            />

            {/* App name + platform badge */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: BRAND,
                  lineHeight: 1.2,
                }}
              >
                NepSaathi
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: MUTED,
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <IconPhone />
                {isIOSSafari ? "Add to iPhone" : "Install free app"}
              </div>
            </div>

            {/* Close button */}
            <button
              className="pwa-close-btn"
              onClick={() => handleDismiss(false)}
              aria-label="Dismiss"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: MUTED,
                fontSize: "16px",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              ×
            </button>
          </div>

          {/* ── Android / Chrome: native install prompt ── */}
          {!isIOSSafari && (
            <>
              <p
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  margin: "0 0 14px",
                  lineHeight: 1.5,
                }}
              >
                Get faster access, offline support, and a full-screen
                experience — just like a native app.
              </p>

              {/* Feature pills */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                {[
                  { icon: "⚡", label: "Faster" },
                  { icon: "📶", label: "Offline" },
                  { icon: "🔔", label: "Notifications" },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "20px",
                      background: "#F0EFF8",
                      color: BRAND,
                    }}
                  >
                    {icon} {label}
                  </span>
                ))}
              </div>

              <button
                className="pwa-install-btn"
                onClick={handleInstall}
                disabled={installing}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  background: BRAND,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: installing ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s, box-shadow 0.15s, transform 0.12s",
                  boxShadow: "0 2px 8px rgba(38,33,92,0.25)",
                  opacity: installing ? 0.75 : 1,
                }}
              >
                <IconDownload />
                {installing ? "Installing…" : "Install App"}
              </button>
            </>
          )}

          {/* ── iOS Safari: manual step-by-step ── */}
          {isIOSSafari && (
            <>
              <p
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  margin: "0 0 12px",
                  lineHeight: 1.5,
                }}
              >
                Add NepSaathi to your Home Screen for a faster, app-like
                experience.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                <IOSStep
                  num={1}
                  icon={<IconShare />}
                  text={
                    <>
                      Tap the{" "}
                      <strong style={{ color: BRAND }}>Share</strong> button
                      at the bottom of Safari
                    </>
                  }
                />
                <IOSStep
                  num={2}
                  icon={<IconPlus />}
                  text={
                    <>
                      Scroll down and tap{" "}
                      <strong style={{ color: BRAND }}>"Add to Home Screen"</strong>
                    </>
                  }
                />
                <IOSStep
                  num={3}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  }
                  text={
                    <>
                      Tap <strong style={{ color: BRAND }}>"Add"</strong> in the top-right corner
                    </>
                  }
                />
              </div>
            </>
          )}

          {/* Not now link */}
          <button
            className="pwa-dismiss-btn"
            onClick={() => handleDismiss(false)}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "8px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              color: MUTED,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            Not now — remind me later
          </button>
        </div>
      </div>
    </>
  );
}
