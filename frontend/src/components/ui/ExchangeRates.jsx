import { useQuery } from "@tanstack/react-query";
import { getExchangeRates } from "../../api/exchange";

export default function ExchangeRates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: getExchangeRates,
    staleTime: 1000 * 60 * 60, // cache for 1 hour in React Query too
    refetchOnWindowFocus: false,
  });

  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {["AUD", "GBP", "USD", "CAD"].map((c) => (
          <div
            key={c}
            style={{
              background: "rgba(255,255,255,0.5)",
              borderRadius: "20px",
              padding: "5px 14px",
              fontSize: "12px",
              color: "#854F0B",
              width: "120px",
              height: "28px",
            }}
          />
        ))}
      </div>
    );

  if (error || !data) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        justifyContent: "center",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* Label */}
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

      {Object.entries(data.rates).map(([currency, info]) => (
        <div
          key={currency}
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "0.5px solid #EFD9C0",
            borderRadius: "20px",
            padding: "4px 12px",
            fontSize: "12px",
            color: "#412402",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "13px" }}>{info.flag}</span>
          <span style={{ fontWeight: 500 }}>1 {currency}</span>
          <span style={{ color: "#854F0B" }}>=</span>
          <span style={{ fontWeight: 600, color: "#26215C" }}>
            {info.rate.toLocaleString()} NPR
          </span>
        </div>
      ))}

      {/* Source indicator */}
      <span
        style={{
          fontSize: "10px",
          color: data.source === "fallback" ? "#A32D2D" : "#3B6D11",
          letterSpacing: "0.03em",
        }}
      >
        {data.source === "fallback" ? "~ approximate" : "● live"}
      </span>
    </div>
  );
}
