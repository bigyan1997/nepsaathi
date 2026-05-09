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
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <Skeleton width="45px" height="10px" />
        <Skeleton width="85%" height="13px" />
        <Skeleton width="65%" height="13px" />
        <Skeleton width="75%" height="11px" />
        <div style={{ display: "flex", gap: "4px", marginTop: "2px" }}>
          <Skeleton width="55px" height="18px" borderRadius="6px" />
          <Skeleton width="48px" height="18px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonJobCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <Skeleton width="50px" height="10px" />
        <Skeleton width="85%" height="13px" />
        <Skeleton width="62%" height="13px" />
        <Skeleton width="68%" height="11px" />
        <Skeleton width="78%" height="11px" />
        <div style={{ display: "flex", gap: "4px", marginTop: "2px" }}>
          <Skeleton width="55px" height="18px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBusinessCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <Skeleton width="80%" height="13px" />
        <Skeleton width="55%" height="13px" />
        <Skeleton width="70px" height="11px" />
        <Skeleton width="58px" height="18px" borderRadius="6px" />
        <Skeleton width="72%" height="11px" />
        <Skeleton width="44px" height="10px" />
      </div>
    </div>
  );
}

export function SkeletonEventCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <Skeleton width="55px" height="18px" borderRadius="6px" />
        <Skeleton width="85%" height="13px" />
        <Skeleton width="60%" height="13px" />
        <Skeleton width="68%" height="11px" />
        <Skeleton width="75%" height="11px" />
      </div>
    </div>
  );
}

export function SkeletonNoticeCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <Skeleton width="58px" height="18px" borderRadius="6px" />
        <Skeleton width="85%" height="13px" />
        <Skeleton width="58%" height="13px" />
        <Skeleton width="72%" height="11px" />
        <Skeleton width="54px" height="10px" />
      </div>
    </div>
  );
}

export function SkeletonHomeRow() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
        <Skeleton width="40px" height="40px" borderRadius="10px" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 }}>
          <Skeleton width="65%" height="14px" />
          <Skeleton width="45%" height="12px" />
          <Skeleton width="28%" height="11px" />
        </div>
      </div>
      <Skeleton width="72px" height="26px" borderRadius="20px" style={{ flexShrink: 0 }} />
    </div>
  );
}

export function SkeletonDesktopCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: "320px",
      }}
    >
      <Skeleton width="100%" height="110px" borderRadius="0" />
      <div
        style={{
          padding: "16px 18px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Skeleton width="48px" height="12px" />
        <Skeleton width="80%" height="17px" />
        <Skeleton width="58%" height="17px" />
        <Skeleton width="52%" height="12px" />
        <Skeleton width="100%" height="13px" style={{ marginTop: "4px" }} />
        <Skeleton width="88%" height="13px" />
        <Skeleton width="72%" height="13px" />
      </div>
      <Skeleton width="100%" height="40px" borderRadius="0" />
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
