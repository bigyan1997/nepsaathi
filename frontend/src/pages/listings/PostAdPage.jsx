import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../../api/listings";
import { createJob } from "../../api/jobs";
import { createRoom } from "../../api/rooms";

const LISTING_TYPES = [
  { value: "job", label: "Job", emoji: "💼", desc: "Post a job vacancy" },
  { value: "room", label: "Room", emoji: "🏠", desc: "List a room for rent" },
  {
    value: "announcement",
    label: "Announcement",
    emoji: "📢",
    desc: "Share news or info",
  },
];

const STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

const JOB_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "casual", label: "Casual" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const SALARY_TYPES = [
  { value: "hourly", label: "Per hour" },
  { value: "weekly", label: "Per week" },
  { value: "monthly", label: "Per month" },
  { value: "yearly", label: "Per year" },
  { value: "negotiable", label: "Negotiable" },
];

const ROOM_TYPES = [
  { value: "private", label: "Private room" },
  { value: "shared", label: "Shared room" },
  { value: "entire", label: "Entire property" },
  { value: "studio", label: "Studio" },
];

const FURNISHING_TYPES = [
  { value: "furnished", label: "Fully furnished" },
  { value: "partial", label: "Partially furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

// Reusable input style
const inputStyle = {
  width: "100%",
  border: "0.5px solid #ccc",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  color: "#333",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#444",
  display: "block",
  marginBottom: "6px",
};

export default function PostAdPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — listing type
  const [listingType, setListingType] = useState("");

  // Step 2 — base listing fields
  const [baseForm, setBaseForm] = useState({
    title: "",
    description: "",
    location: "",
    state: "NSW",
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
  });

  // Step 3 — job specific fields
  const [jobForm, setJobForm] = useState({
    company_name: "",
    job_type: "casual",
    salary: "",
    salary_type: "hourly",
    experience_required: "",
    qualifications: "",
    is_urgent: false,
  });

  // Step 3 — room specific fields
  const [roomForm, setRoomForm] = useState({
    room_type: "private",
    price: "",
    furnishing: "furnished",
    bond: "4_weeks",
    bills_included: false,
    available_from: "",
    bedrooms: 1,
    bathrooms: 1,
    max_occupants: 1,
    nepalese_household: false,
    pets_allowed: false,
    parking_available: false,
  });

  // Handle final submission
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1 — create base listing
      const listing = await createListing({
        ...baseForm,
        listing_type: listingType,
      });

      console.log("Listing created:", listing); // ← add this

      if (!listing.id) {
        setError("Failed to create listing. Please try again.");
        return;
      }

      // Small delay to ensure listing is committed to DB
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2 — attach type specific details
      if (listingType === "job") {
        const jobData = {
          listing: listing.id,
          ...jobForm,
          salary: jobForm.salary || null,
        };
        console.log("Creating job with:", jobData); // ← add this
        await createJob(jobData);
        navigate(`/jobs/listing/${listing.id}`);
      } else if (listingType === "room") {
        const roomData = {
          listing: listing.id,
          ...roomForm,
          price: roomForm.price,
        };
        console.log("Creating room with:", roomData); // ← add this
        await createRoom(roomData);
        navigate(`/rooms/listing/${listing.id}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Full error:", err.response); // ← add this
      const errors = err.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          setError(firstError[0]);
        } else if (typeof firstError === "string") {
          setError(firstError);
        } else if (typeof firstError === "object") {
          setError(JSON.stringify(firstError));
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "6px",
          }}
        >
          Post a free ad
        </h1>
        <p style={{ fontSize: "13px", color: "#888" }}>
          Reach thousands of Nepalese Australians instantly
        </p>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: step >= s ? "#534AB7" : "#e5e5e5",
                color: step >= s ? "#fff" : "#aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                style={{
                  width: "40px",
                  height: "1px",
                  background: step > s ? "#534AB7" : "#e5e5e5",
                }}
              />
            )}
          </div>
        ))}
        <span style={{ fontSize: "12px", color: "#888", marginLeft: "8px" }}>
          {step === 1
            ? "Choose type"
            : step === 2
              ? "Basic details"
              : "Specific details"}
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px",
        }}
      >
        {/* Error */}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#A32D2D",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* ── STEP 1 — Choose listing type ── */}
        {step === 1 && (
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#26215C",
                marginBottom: "16px",
              }}
            >
              What are you posting?
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {LISTING_TYPES.map(({ value, label, emoji, desc }) => (
                <div
                  key={value}
                  onClick={() => setListingType(value)}
                  style={{
                    border:
                      listingType === value
                        ? "1.5px solid #534AB7"
                        : "0.5px solid #e5e5e5",
                    background: listingType === value ? "#EEEDFE" : "#fff",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>{emoji}</span>
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: listingType === value ? "#26215C" : "#333",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {desc}
                    </div>
                  </div>
                  {listingType === value && (
                    <div
                      style={{
                        marginLeft: "auto",
                        color: "#534AB7",
                        fontWeight: 600,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (!listingType) {
                  setError("Please select a listing type.");
                  return;
                }
                setError("");
                setStep(2);
              }}
              style={{
                marginTop: "20px",
                width: "100%",
                background: "#534AB7",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2 — Basic details ── */}
        {step === 2 && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#26215C" }}>
              Basic details
            </h2>

            <div>
              <label style={labelStyle}>Title *</label>
              <input
                style={inputStyle}
                placeholder={
                  listingType === "job"
                    ? "e.g. Kitchen Hand Wanted"
                    : listingType === "room"
                      ? "e.g. Private room in Parramatta"
                      : "e.g. Community announcement"
                }
                value={baseForm.title}
                onChange={(e) =>
                  setBaseForm({ ...baseForm, title: e.target.value })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Description *</label>
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: "100px",
                  resize: "vertical",
                }}
                placeholder="Describe your listing in detail..."
                value={baseForm.description}
                onChange={(e) =>
                  setBaseForm({ ...baseForm, description: e.target.value })
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Suburb / City *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Parramatta"
                  value={baseForm.location}
                  onChange={(e) =>
                    setBaseForm({ ...baseForm, location: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <select
                  style={inputStyle}
                  value={baseForm.state}
                  onChange={(e) =>
                    setBaseForm({ ...baseForm, state: e.target.value })
                  }
                >
                  {STATES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Contact phone</label>
              <input
                style={inputStyle}
                placeholder="e.g. 0412 345 678"
                value={baseForm.contact_phone}
                onChange={(e) =>
                  setBaseForm({ ...baseForm, contact_phone: e.target.value })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>WhatsApp number</label>
              <input
                style={inputStyle}
                placeholder="e.g. 0412 345 678"
                value={baseForm.contact_whatsapp}
                onChange={(e) =>
                  setBaseForm({ ...baseForm, contact_whatsapp: e.target.value })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Contact email</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="e.g. hello@example.com"
                value={baseForm.contact_email}
                onChange={(e) =>
                  setBaseForm({ ...baseForm, contact_email: e.target.value })
                }
              />
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#555",
                  border: "0.5px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (
                    !baseForm.title ||
                    !baseForm.description ||
                    !baseForm.location
                  ) {
                    setError("Please fill in title, description and location.");
                    return;
                  }
                  setError("");
                  // If announcement — submit directly, no step 3 needed
                  if (listingType === "announcement") {
                    handleSubmit();
                  } else {
                    setStep(3);
                  }
                }}
                style={{
                  flex: 2,
                  background: "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {listingType === "announcement"
                  ? "Post announcement"
                  : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Job specific details ── */}
        {step === 3 && listingType === "job" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#26215C" }}>
              Job details
            </h2>

            <div>
              <label style={labelStyle}>Company name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Himalayan Cafe"
                value={jobForm.company_name}
                onChange={(e) =>
                  setJobForm({ ...jobForm, company_name: e.target.value })
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Job type *</label>
                <select
                  style={inputStyle}
                  value={jobForm.job_type}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, job_type: e.target.value })
                  }
                >
                  {JOB_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Salary type</label>
                <select
                  style={inputStyle}
                  value={jobForm.salary_type}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, salary_type: e.target.value })
                  }
                >
                  {SALARY_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Salary (AUD)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="e.g. 23.50"
                value={jobForm.salary}
                onChange={(e) =>
                  setJobForm({ ...jobForm, salary: e.target.value })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Experience required</label>
              <input
                style={inputStyle}
                placeholder="e.g. 1 year kitchen experience"
                value={jobForm.experience_required}
                onChange={(e) =>
                  setJobForm({
                    ...jobForm,
                    experience_required: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Qualifications</label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                placeholder="e.g. Food handler certificate preferred"
                value={jobForm.qualifications}
                onChange={(e) =>
                  setJobForm({ ...jobForm, qualifications: e.target.value })
                }
              />
            </div>

            {/* Urgent checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#444",
              }}
            >
              <input
                type="checkbox"
                checked={jobForm.is_urgent}
                onChange={(e) =>
                  setJobForm({ ...jobForm, is_urgent: e.target.checked })
                }
              />
              Mark as urgent — highlights your listing
            </label>

            {/* Navigation */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#555",
                  border: "0.5px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2,
                  background: loading ? "#ccc" : "#E87722",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Posting..." : "Post job →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Room specific details ── */}
        {step === 3 && listingType === "room" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#26215C" }}>
              Room details
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Room type *</label>
                <select
                  style={inputStyle}
                  value={roomForm.room_type}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, room_type: e.target.value })
                  }
                >
                  {ROOM_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Furnishing</label>
                <select
                  style={inputStyle}
                  value={roomForm.furnishing}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, furnishing: e.target.value })
                  }
                >
                  {FURNISHING_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Weekly rent (AUD) *</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="e.g. 250"
                  value={roomForm.price}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, price: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Available from</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={roomForm.available_from}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, available_from: e.target.value })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={roomForm.bedrooms}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, bedrooms: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={roomForm.bathrooms}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, bathrooms: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Max occupants</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={roomForm.max_occupants}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, max_occupants: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {[
                {
                  key: "bills_included",
                  label: "Bills included (electricity, water, internet)",
                },
                { key: "nepalese_household", label: "🇳🇵 Nepalese household" },
                { key: "pets_allowed", label: "Pets allowed" },
                { key: "parking_available", label: "Parking available" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#444",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={roomForm[key]}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#555",
                  border: "0.5px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2,
                  background: loading ? "#ccc" : "#E87722",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Posting..." : "Post room →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
