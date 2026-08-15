// Safe meeting spots — dynamically generated from the listing's suburb via Google Maps search.
const SPOT_TYPES = [
  {
    icon: '📚',
    label: 'Library nearby',
    query: (loc) => `public library near ${loc}`,
    tip: 'Free, public, CCTV, friendly staff — great first-meeting choice',
  },
  {
    icon: '🏬',
    label: 'Shopping centre nearby',
    query: (loc) => `shopping centre near ${loc}`,
    tip: 'High foot traffic, security cameras, easy parking',
  },
  {
    icon: '🚔',
    label: 'Police station nearby',
    query: (loc) => `police station near ${loc}`,
    tip: 'Open 24/7 — the safest possible first meeting point',
  },
];

function safeMapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function SafeMeetingPoints({ state, suburb }) {
  const location = [suburb, state, 'Australia'].filter(Boolean).join(', ');

  return (
    <div
      style={{
        marginTop: '20px',
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '10px',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Suggested safe meeting spots
          {suburb && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '5px', color: '#ea580c' }}>near {suburb}</span>}
        </span>
      </div>
      <p style={{ fontSize: '12px', color: '#9a3412', marginBottom: '10px', lineHeight: 1.5 }}>
        When viewing this room in person, consider meeting the host at a public place first.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {SPOT_TYPES.map((spot) => (
          <a
            key={spot.label}
            href={safeMapsUrl(spot.query(location))}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '10px 12px',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.6)')}
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{spot.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#7c2d12', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {spot.label}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
              <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '2px' }}>{spot.tip}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
