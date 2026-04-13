import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: "#FFF1E0",
          borderBottom: "0.5px solid #EFD9C0",
          padding: "56px 28px 44px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "#E87722",
            fontWeight: 500,
            letterSpacing: "0.08em",
            marginBottom: "10px",
          }}
        >
          नेपसाथी · your Nepali friend, wherever you are
        </p>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: "#26215C",
            maxWidth: "520px",
            margin: "0 auto 12px",
            lineHeight: 1.2,
          }}
        >
          Find <span style={{ color: "#E87722" }}>work</span> and a place to{" "}
          <span style={{ color: "#E87722" }}>call home</span> in Australia
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#633806",
            maxWidth: "400px",
            margin: "0 auto 28px",
            lineHeight: 1.65,
          }}
        >
          Jobs, rooms and community for Nepalese Australians — all in one place.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link
            to="/jobs"
            style={{
              background: "#534AB7",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Browse jobs
          </Link>
          <Link
            to="/rooms"
            style={{
              background: "#E87722",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Find rooms
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          padding: "28px",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {[
          { num: "1,240+", label: "Active job listings", color: "#E87722" },
          { num: "830+", label: "Rooms available", color: "#534AB7" },
          { num: "5,600+", label: "Community members", color: "#26215C" },
        ].map(({ num, label, color }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "16px",
              textAlign: "center",
              border: "0.5px solid #e5e5e5",
            }}
          >
            <div style={{ fontSize: "26px", fontWeight: 600, color }}>
              {num}
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
