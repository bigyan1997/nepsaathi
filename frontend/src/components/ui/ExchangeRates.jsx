import { useQuery } from "@tanstack/react-query";
import { getExchangeRates } from "../../api/exchange";

export default function ExchangeRates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: getExchangeRates,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          overflowX: "auto",
          padding: "4px 0",
        }}
      >
        {["AUD", "GBP", "USD", "CAD"].map((c) => (
          <div
            key={c}
            style={{
              background: "rgba(255,255,255,0.5)",
              borderRadius: "20px",
              padding: "5px 14px",
              width: "120px",
              height: "28px",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    );

  if (error || !data) return null;

  return (
    <div style={{ width: "100%" }}>
      {/* Label + source */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "#854F0B",
            fontWeight: 500,
            letterSpacing: "0.04em",
          }}
        >
          LIVE RATES →
        </span>
        <span
          style={{
            fontSize: "10px",
            color: data.source === "fallback" ? "#A32D2D" : "#3B6D11",
          }}
        >
          {data.source === "fallback" ? "~ approximate" : "● live"}
        </span>
      </div>

      {/* Scrollable rates row */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "4px 8px",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE
          justifyContent: "center",
        }}
      >
        <style>{`.exchange-scroll::-webkit-scrollbar { display: none; }`}</style>
        {Object.entries(data.rates).map(([currency, info]) => (
          <div
            key={currency}
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "0.5px solid #EFD9C0",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              color: "#412402",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "14px" }}>{info.flag}</span>
            <span style={{ fontWeight: 500 }}>1 {currency}</span>
            <span style={{ color: "#854F0B" }}>=</span>
            <span style={{ fontWeight: 600, color: "#26215C" }}>
              {info.rate.toLocaleString()} NPR
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
