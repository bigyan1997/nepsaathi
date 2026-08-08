import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRates } from "../api/remittance";

const PROVIDER_META = {
  wise:       { color: "#163300", bg: "#9FE870", label: "Wise" },
  remitly:    { color: "#fff",    bg: "#2B3FD0", label: "Remitly" },
  worldremit: { color: "#fff",    bg: "#E31837", label: "WorldRemit" },
  wu:         { color: "#000",    bg: "#FFDD00", label: "Western Union" },
};

function minutesAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

function ProviderBadge({ provider }) {
  const m = PROVIDER_META[provider] || { color: "#fff", bg: "#888", label: provider };
  return (
    <span style={{
      display: "inline-block",
      background: m.bg,
      color: m.color,
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 6,
      padding: "3px 8px",
      letterSpacing: "0.02em",
    }}>
      {m.label}
    </span>
  );
}

export default function RemittancePage() {
  const [amount, setAmount] = useState(500);

  const { data: rates = [], isLoading, isError } = useQuery({
    queryKey: ["remittance-rates"],
    queryFn: getRates,
    staleTime: 1000 * 60 * 15,
  });

  const rows = useMemo(() => {
    return [...rates]
      .map((r) => {
        const fee = parseFloat(r.fee_aud) || 0;
        const rate = parseFloat(r.rate) || 0;
        const sendable = Math.max(0, amount - fee);
        const received = Math.round(sendable * rate);
        return { ...r, fee, rate, received };
      })
      .sort((a, b) => b.received - a.received);
  }, [rates, amount]);

  const lastUpdated = rates.length
    ? rates.reduce((latest, r) =>
        new Date(r.fetched_at) > new Date(latest) ? r.fetched_at : latest,
        rates[0].fetched_at)
    : null;

  const midMarket = rows.length ? Math.max(...rows.map((r) => r.rate)).toFixed(2) : null;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 60px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#26215C", margin: "0 0 6px" }}>
          Send money to Nepal
        </h1>
        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
          Compare live AUD → NPR rates across major providers. No account needed.
        </p>
      </div>

      {/* Amount input */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #534AB7",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            I want to send
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#26215C" }}>AUD</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#26215C",
                border: "none",
                outline: "none",
                background: "transparent",
                width: 140,
              }}
            />
          </div>
        </div>
        <div style={{ borderLeft: "1px solid #f0f0f0", paddingLeft: 24, flex: "1 1 180px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            To
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#26215C" }}>
            🇳🇵 Nepal (NPR)
          </div>
        </div>
        {midMarket && (
          <div style={{ borderLeft: "1px solid #f0f0f0", paddingLeft: 24, flex: "0 0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Best rate today
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>
              {midMarket} <span style={{ fontSize: 13, fontWeight: 500 }}>NPR/AUD</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick amounts */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {[200, 500, 1000, 2000, 5000].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: `1.5px solid ${amount === v ? "#534AB7" : "#e5e5e5"}`,
              background: amount === v ? "#EEEDFE" : "#fff",
              color: amount === v ? "#534AB7" : "#555",
              fontSize: 13,
              fontWeight: amount === v ? 700 : 400,
              cursor: "pointer",
            }}
          >
            ${v}
          </button>
        ))}
      </div>

      {/* Rates table */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 80, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {isError && (
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14, padding: "32px", textAlign: "center", color: "#888" }}>
          Could not load rates right now. Please try again shortly.
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14, padding: "32px", textAlign: "center", color: "#888" }}>
          Rates haven't been fetched yet. Check back in a few minutes.
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r, idx) => (
            <div
              key={r.provider}
              style={{
                background: "#fff",
                border: `1.5px solid ${idx === 0 ? "#16a34a" : "#f0f0f0"}`,
                borderRadius: 14,
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                position: "relative",
              }}
            >
              {idx === 0 && (
                <span style={{
                  position: "absolute",
                  top: -10,
                  left: 16,
                  background: "#16a34a",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 10px",
                  borderRadius: 10,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  Best deal
                </span>
              )}

              {/* Provider */}
              <div style={{ flex: "0 0 130px" }}>
                <ProviderBadge provider={r.provider} />
              </div>

              {/* Rate */}
              <div style={{ flex: "1 1 120px" }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Exchange rate</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#26215C" }}>
                  {r.rate.toFixed(2)} <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>NPR/AUD</span>
                </div>
              </div>

              {/* Fee */}
              <div style={{ flex: "1 1 80px" }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Transfer fee</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: r.fee === 0 ? "#16a34a" : "#26215C" }}>
                  {r.fee === 0 ? "Free" : `$${r.fee.toFixed(2)}`}
                </div>
              </div>

              {/* Received */}
              <div style={{ flex: "1 1 130px" }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Recipient gets</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: idx === 0 ? "#16a34a" : "#534AB7" }}>
                  {r.received.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500, color: "#888" }}>NPR</span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={r.send_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0,
                  background: idx === 0 ? "#16a34a" : "#534AB7",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Send now →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        {lastUpdated && (
          <span style={{ fontSize: 12, color: "#aaa" }}>
            Rates updated {minutesAgo(lastUpdated)}
          </span>
        )}
        <span style={{ fontSize: 12, color: "#aaa" }}>
          Actual rates may vary. Fees shown for bank transfers.
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
