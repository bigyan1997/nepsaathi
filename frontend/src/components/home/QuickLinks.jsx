import { Link } from "react-router-dom";

const LINKS = [
  { to: "/send-money",       emoji: "💸", label: "Send Money"   },
  { to: "/forum",            emoji: "💬", label: "Community"    },
  { to: "/guides/banking",   emoji: "📖", label: "Guides"       },
  { to: "/visa",             emoji: "🛂", label: "Visa Hub"     },
  { to: "/whatsapp-groups",  emoji: "📱", label: "WhatsApp"     },
  { to: "/new-to-australia", emoji: "🇦🇺", label: "New Here?"   },
];

export default function QuickLinks() {
  return (
    <div className="home-section" style={{ padding: "20px 28px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <style>{`
        .ql-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        @media (max-width: 600px) {
          .ql-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
        }
        .ql-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          padding: 12px 6px;
          border-radius: 12px;
          background: #fff;
          border: 0.5px solid #ebebeb;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .ql-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .ql-emoji { font-size: 24px; line-height: 1; }
        .ql-label { font-size: 11px; font-weight: 600; color: #444; text-align: center; line-height: 1.2; }
      `}</style>
      <div className="ql-grid">
        {LINKS.map(({ to, emoji, label }) => (
          <Link key={to} to={to} className="ql-item">
            <span className="ql-emoji">{emoji}</span>
            <span className="ql-label">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
