export default function StatsBar({ stats }) {
  const items = [
    { num: stats ? `${stats.total_jobs}+` : "—",    label: "Active job listings", color: "#E87722", icon: "💼" },
    { num: stats ? `${stats.total_rooms}+` : "—",   label: "Rooms available",     color: "#534AB7", icon: "🏠" },
    { num: stats ? `${stats.total_members}+` : "—", label: "Community members",   color: "#1D9E75", icon: "🤝" },
  ];
  return (
    <div className="home-section" style={{ padding: "20px 28px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ background: "#fff", borderRadius: "14px", border: "0.5px solid #ebebeb", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", overflow: "hidden" }}>
        {items.map(({ num, label, color, icon }, i) => (
          <div
            key={label}
            style={{ padding: "18px 16px", textAlign: "center", borderRight: i < 2 ? "0.5px solid #f0f0f0" : "none" }}
          >
            <div style={{ fontSize: "11px", marginBottom: "6px" }}>{icon}</div>
            <div className="stat-num" style={{ fontSize: "30px", fontWeight: 800, color, letterSpacing: "-1px", lineHeight: 1 }}>
              {num}
            </div>
            <div style={{ fontSize: "12px", color: "#aaa", marginTop: "5px", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
