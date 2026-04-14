export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "6px",
  style = {},
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "12px",
        padding: "18px 20px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
      }}
    >
      <Skeleton width="42px" height="42px" borderRadius="10px" />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Skeleton width="60%" height="14px" />
        <Skeleton width="40%" height="12px" />
        <Skeleton width="30%" height="11px" />
      </div>
      <Skeleton width="80px" height="28px" borderRadius="20px" />
    </div>
  );
}

export function SkeletonRoomCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Skeleton width="70%" height="13px" />
        <Skeleton width="50%" height="12px" />
        <Skeleton width="40%" height="11px" />
      </div>
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px" }}>
      <Skeleton width="100px" height="13px" style={{ marginBottom: "20px" }} />
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flex: 1,
            }}
          >
            <Skeleton width="120px" height="11px" />
            <Skeleton width="60%" height="22px" />
            <Skeleton width="40%" height="14px" />
          </div>
          <Skeleton width="90px" height="32px" borderRadius="20px" />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton width="80px" height="24px" borderRadius="10px" />
          <Skeleton width="120px" height="24px" borderRadius="10px" />
        </div>
        <Skeleton width="100%" height="0.5px" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <Skeleton width="60px" height="11px" />
              <Skeleton width="80%" height="14px" />
            </div>
          ))}
        </div>
        <Skeleton width="100%" height="0.5px" />
        <Skeleton width="40%" height="15px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="90%" height="14px" />
        <Skeleton width="80%" height="14px" />
      </div>
    </div>
  );
}

// Add shimmer animation globally
const style = document.createElement("style");
style.textContent = `
  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(style);
