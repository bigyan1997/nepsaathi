// Static curated safe meeting spots by state for in-person room viewings.
const SPOTS_BY_STATE = {
  NSW: [
    { name: "Westfield Shopping Centres", detail: "Parramatta, Bondi, Chatswood, Burwood — busy, CCTV, open daily" },
    { name: "Your local public library", detail: "Free, safe, public space — find yours at library.nsw.gov.au" },
    { name: "Service NSW Centre", detail: "Government office — well-lit, public, open hours Mon–Fri" },
  ],
  VIC: [
    { name: "Westfield or Chadstone Shopping Centre", detail: "Busy shopping centres across Melbourne — CCTV, public space" },
    { name: "Your local public library", detail: "Find one at librariesvictoria.net.au" },
    { name: "Melbourne CBD — Flinders Street Station area", detail: "Extremely busy public area, good for a first meeting" },
  ],
  QLD: [
    { name: "Westfield Carindale or Chermside", detail: "Major shopping centres with good foot traffic and security" },
    { name: "Brisbane City Council library", detail: "queensland.gov.au/library — open Mon–Sat" },
    { name: "South Bank Parklands", detail: "Open public space, well-lit, popular with locals" },
  ],
  WA: [
    { name: "Westfield Carousel or Whitford City", detail: "Busy shopping centres in Perth" },
    { name: "Perth City Library", detail: "Public space in the CBD, Mon–Sat" },
    { name: "Northbridge area", detail: "Busy public precinct in central Perth" },
  ],
  SA: [
    { name: "Westfield Marion or Tea Tree Plaza", detail: "Major shopping centres in Adelaide" },
    { name: "Adelaide City Library", detail: "Public library in Rundle Mall, central location" },
    { name: "Victoria Square / Tarndanyangga", detail: "Central public square in Adelaide CBD" },
  ],
  ACT: [
    { name: "Westfield Belconnen or Woden", detail: "Popular shopping centres in Canberra" },
    { name: "Canberra City Library", detail: "ACT Library in the CBD" },
  ],
  TAS: [
    { name: "Cat and Fiddle Arcade or Eastlands", detail: "Shopping centres in Hobart" },
    { name: "Hobart Library", detail: "Libraries Tasmania, central location" },
  ],
  NT: [
    { name: "Casuarina Square", detail: "Darwin's main shopping centre" },
    { name: "Darwin City Library", detail: "Central Darwin public library" },
  ],
};

export default function SafeMeetingPoints({ state }) {
  const spots = SPOTS_BY_STATE[state] || SPOTS_BY_STATE["NSW"];

  return (
    <div
      style={{
        marginTop: "20px",
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        borderRadius: "10px",
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "12px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Suggested safe meeting spots
        </span>
      </div>
      <p style={{ fontSize: "12px", color: "#9a3412", marginBottom: "10px", lineHeight: 1.5 }}>
        When viewing this room in person, consider meeting the host at a public place first.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {spots.map((spot, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              background: "rgba(255,255,255,0.6)",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🏢</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#7c2d12" }}>{spot.name}</div>
              <div style={{ fontSize: "12px", color: "#9a3412", marginTop: "2px" }}>{spot.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
