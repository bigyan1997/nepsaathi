export default function EmptyState({ emoji, title, subtitle, onClear, accentColor, accentBg }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "56px 24px 48px",
        textAlign: "center",
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: "88px",
          height: "88px",
          borderRadius: "50%",
          background: accentBg || "#F5F4F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "44px",
          marginBottom: "20px",
          boxShadow: `0 0 0 8px ${accentBg || "#F5F4F0"}80`,
        }}
      >
        {emoji}
      </div>

      <p style={{ fontSize: "17px", fontWeight: 700, color: "#26215C", marginBottom: "6px" }}>
        {title}
      </p>
      <p style={{ fontSize: "13px", color: "#888", maxWidth: "260px", lineHeight: 1.5 }}>
        {subtitle || "Try adjusting your filters or search terms"}
      </p>

      {onClear && (
        <button
          onClick={onClear}
          style={{
            marginTop: "20px",
            background: accentBg || "#F5F4F0",
            border: `1.5px solid ${accentColor || "#ccc"}40`,
            borderRadius: "10px",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: 600,
            color: accentColor || "#555",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
