export default function StatsBar({ stats }) {
  const items = [
    { num: stats ? `${stats.total_jobs}+` : "—",    label: "Active job listings", color: "#E87722" },
    { num: stats ? `${stats.total_rooms}+` : "—",   label: "Rooms available",     color: "#534AB7" },
    { num: stats ? `${stats.total_members}+` : "—", label: "Community members",   color: "#26215C" },
  ];
  return (
    <div className="home-section" style={{ padding: "20px 28px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); overflow: hidden; }
        .stats-item { padding: 20px 16px; text-align: center; }
        .stats-item:not(:last-child) { border-right: 0.5px solid #f0f0f0; }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stats-item:nth-child(2) { border-right: none; }
          .stats-item:last-child { grid-column: 1 / -1; border-top: 0.5px solid #f0f0f0; border-right: none; }
        }
      `}</style>
      <div className="stats-grid" style={{ background: "#fff", borderRadius: "14px", border: "0.5px solid #ebebeb" }}>
        {items.map(({ num, label, color }) => (
          <div key={label} className="stats-item">
            <div className="stat-num" style={{ fontSize: "22px", fontWeight: 700, color, letterSpacing: "-0.5px" }}>{num}</div>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "3px", fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
