import { useEffect, useState } from "react";

export default function IdleTimeoutModal({ secondsTotal, onStay, onLogout }) {
  const [remaining, setRemaining] = useState(secondsTotal);

  useEffect(() => {
    setRemaining(secondsTotal);
    const interval = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsTotal]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, "0")}`
    : `${secs}s`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "32px 28px",
        maxWidth: "380px", width: "100%", textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#FEF3C7", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
          fontSize: 28,
        }}>⏱</div>

        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
          Still there?
        </h2>
        <p style={{ margin: "0 0 6px", color: "#555", fontSize: 15, lineHeight: 1.5 }}>
          You've been inactive for a while.
        </p>
        <p style={{ margin: "0 0 28px", color: "#888", fontSize: 14 }}>
          You'll be logged out in{" "}
          <span style={{ fontWeight: 700, color: remaining <= 30 ? "#ef4444" : "#D97706" }}>
            {timeStr}
          </span>
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onLogout}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "1.5px solid #e5e7eb",
              background: "#fff", color: "#555", fontWeight: 600, fontSize: 14,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
          <button
            onClick={onStay}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
              background: "#C8392B", color: "#fff", fontWeight: 600, fontSize: 14,
              cursor: "pointer",
            }}
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}
