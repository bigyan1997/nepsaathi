import { useEffect, useRef } from "react";

const SPIN_CSS = `@keyframes lmf-spin{to{transform:rotate(360deg)}}`;

export default function LoadMoreFooter({ count, total, onLoadMore, isFetching, label, accentColor, accentBg }) {
  const pct = total > 0 ? Math.min(count / total, 1) : 0;
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current || document.getElementById("lmf-spin-style")) return;
    styleRef.current = true;
    const s = document.createElement("style");
    s.id = "lmf-spin-style";
    s.textContent = SPIN_CSS;
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{ paddingTop: "32px", paddingBottom: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
      {/* Progress track */}
      <div style={{ width: "100%", maxWidth: "340px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "7px" }}>
          <span style={{ fontSize: "12px", color: "#888" }}>
            Showing <strong style={{ color: "#555" }}>{count}</strong> of <strong style={{ color: "#555" }}>{total}</strong> {label}
          </span>
          <span style={{ fontSize: "11px", color: accentColor, fontWeight: 600 }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: "5px", background: "#e8e7f0", borderRadius: "3px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${pct * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`,
              borderRadius: "3px",
              transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onLoadMore}
        disabled={isFetching}
        style={{
          background: accentBg,
          border: `1.5px solid ${accentColor}35`,
          borderRadius: "12px",
          padding: "12px 36px",
          fontSize: "13px",
          fontWeight: 700,
          color: accentColor,
          cursor: isFetching ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "opacity 0.15s, transform 0.15s",
          opacity: isFetching ? 0.7 : 1,
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => { if (!isFetching) e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {isFetching ? (
          <>
            <span
              style={{
                width: "13px",
                height: "13px",
                border: `2px solid ${accentColor}40`,
                borderTopColor: accentColor,
                borderRadius: "50%",
                animation: "lmf-spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            Loading…
          </>
        ) : (
          <>Load more {label}</>
        )}
      </button>
    </div>
  );
}
