export default function StatsBar({ stats }) {
  const items = [
    { num: stats ? `${stats.total_jobs}+` : "—",     label: "Active job listings",   color: "#E87722" },
    { num: stats ? `${stats.total_rooms}+` : "—",    label: "Rooms available",        color: "#534AB7" },
    { num: stats ? `${stats.total_members}+` : "—",  label: "Community members",      color: "#26215C" },
  ];
  return (
    <div
      className="home-section stats-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        padding: "28px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {items.map(({ num, label, color }) => (
        <div
          key={label}
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "18px",
            textAlign: "center",
            border: "0.5px solid #e5e5e5",
          }}
        >
          <div className="stat-num" style={{ fontSize: "28px", fontWeight: 700, color }}>
            {num}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
