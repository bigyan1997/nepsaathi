import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "28px",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <div style={{ position: "relative", width: "36px", height: "26px" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 2,
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#E87722",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "11px",
              top: 2,
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#534AB7",
              opacity: 0.88,
            }}
          />
        </div>
        <span style={{ fontSize: "18px", fontWeight: 600 }}>
          <span style={{ color: "#E87722" }}>Nep</span>
          <span style={{ color: "#26215C" }}>Saathi</span>
        </span>
      </div>

      <h1
        style={{
          fontSize: "72px",
          fontWeight: 700,
          color: "#EEEDFE",
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: 600,
          color: "#26215C",
          margin: "12px 0 8px",
        }}
      >
        Page not found
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "#888",
          maxWidth: "320px",
          lineHeight: 1.6,
          marginBottom: "28px",
        }}
      >
        The page you're looking for doesn't exist or has been removed.
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <Link
          to="/"
          style={{
            background: "#534AB7",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Go home
        </Link>
        <Link
          to="/jobs"
          style={{
            background: "#FFF1E0",
            color: "#E87722",
            padding: "10px 24px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
            border: "0.5px solid #EFD9C0",
          }}
        >
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
