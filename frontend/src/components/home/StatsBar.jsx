export default function StatsBar({ stats }) {
  const items = [
    { num: stats ? `${stats.total_jobs}+` : "—",        label: "Active job listings", color: "#E87722", emoji: "💼" },
    { num: stats ? `${stats.total_rooms}+` : "—",       label: "Rooms available",     color: "#534AB7", emoji: "🛏️" },
    { num: stats ? `${stats.total_businesses}+` : "—",  label: "Businesses listed",   color: "#E87722", emoji: "🏪" },
    { num: stats ? `${stats.total_members}+` : "—",     label: "Community members",   color: "#26215C", emoji: "🤝" },
  ];
  return (
    <div className="home-section" style={{ padding: "20px 28px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); overflow: hidden; }
        .stats-item { padding: 20px 12px; text-align: center; }
        .stats-item:not(:last-child) { border-right: 0.5px solid #f0f0f0; }
        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stats-item:nth-child(2) { border-right: none; }
          .stats-item:nth-child(3) { border-top: 0.5px solid #f0f0f0; }
          .stats-item:nth-child(4) { border-top: 0.5px solid #f0f0f0; border-right: none; }
        }
      `}</style>
      <div className="stats-grid" style={{ background: "#fff", borderRadius: "14px", border: "0.5px solid #ebebeb" }}>
        {items.map(({ num, label, color, emoji }) => (
          <div key={label} className="stats-item">
            <div style={{ fontSize: "18px", lineHeight: 1, marginBottom: "4px" }}>{emoji}</div>
            <div className="stat-num" style={{ fontSize: "22px", fontWeight: 700, color, letterSpacing: "-0.5px" }}>{num}</div>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "3px", fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
