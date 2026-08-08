import { useQuery } from "@tanstack/react-query";
import { getBenchmark } from "../../api/listings";

export default function MarketBenchmark({ type, jobType, location, state }) {
  const params =
    type === "job"
      ? { type: "job", job_type: jobType, state }
      : { type: "room", location, state };

  const { data, isLoading } = useQuery({
    queryKey: ["benchmark", type, jobType || location, state],
    queryFn: () => getBenchmark(params),
    staleTime: 1000 * 60 * 60, // 1 hour — market data doesn't change quickly
    enabled: !!state,
  });

  if (isLoading || !data?.available) return null;

  const isJob = type === "job";
  const avg = isJob
    ? `$${data.avg.toFixed(2)}${data.suffix}`
    : `$${data.avg.toFixed(0)}/wk`;
  const min = isJob
    ? `$${data.min.toFixed(2)}${data.suffix}`
    : `$${data.min.toFixed(0)}/wk`;
  const max = isJob
    ? `$${data.max.toFixed(2)}${data.suffix}`
    : `$${data.max.toFixed(0)}/wk`;

  return (
    <div
      style={{
        marginTop: "16px",
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "10px",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "10px",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        <span
          style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.4px" }}
        >
          Market rate — {data.label}
        </span>
      </div>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600, marginBottom: "2px" }}>
            Typical
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#15803d" }}>{avg}</div>
        </div>
        <div style={{ width: "1px", background: "#bbf7d0" }} />
        <div>
          <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600, marginBottom: "2px" }}>
            Low
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#15803d" }}>{min}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600, marginBottom: "2px" }}>
            High
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#15803d" }}>{max}</div>
        </div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "11px", color: "#4ade80" }}>
        Based on {data.count} active listing{data.count !== 1 ? "s" : ""} on NepSaathi
      </div>
    </div>
  );
}
