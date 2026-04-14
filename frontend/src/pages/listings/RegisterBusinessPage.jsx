import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBusiness } from "../../api/businesses";

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

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant & Cafe" },
  { value: "grocery", label: "Grocery & Food Store" },
  { value: "travel", label: "Travel & Tourism" },
  { value: "beauty", label: "Beauty & Salon" },
  { value: "health", label: "Health & Medical" },
  { value: "legal", label: "Legal & Accounting" },
  { value: "education", label: "Education & Tutoring" },
  { value: "religious", label: "Religious Services" },
  { value: "construction", label: "Construction & Trade" },
  { value: "transport", label: "Transport & Logistics" },
  { value: "finance", label: "Finance & Money Transfer" },
  { value: "freelancer", label: "Freelancer & Pujari" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "other", label: "Other" },
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

export default function RegisterBusinessPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    business_name: "",
    category: "restaurant",
    description: "",
    is_nepalese_owned: true,
    address: "",
    suburb: "",
    state: "NSW",
    postcode: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    abn: "",
    established_year: "",
    operating_hours: "",
  });

  const handleSubmit = async () => {
    if (!form.business_name || !form.description || !form.suburb) {
      setError("Please fill in business name, description and suburb.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const business = await createBusiness({
        ...form,
        established_year: form.established_year || null,
      });
      navigate(`/businesses/${business.id}`);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "28px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "6px",
          }}
        >
          Register your business
        </h1>
        <p style={{ fontSize: "13px", color: "#888" }}>
          List your Nepalese business — free forever
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#A32D2D",
            }}
          >
            {error}
          </div>
        )}

        {/* Business name */}
        <div>
          <label style={labelStyle}>Business name *</label>
          <input
            style={inputStyle}
            placeholder="e.g. Himalayan Cafe"
            value={form.business_name}
            onChange={(e) =>
              setForm({ ...form, business_name: e.target.value })
            }
          />
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Category *</label>
          <select
            style={inputStyle}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>About your business *</label>
          <textarea
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            placeholder="Describe what your business offers..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Location */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Suburb *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Parramatta"
              value={form.suburb}
              onChange={(e) => setForm({ ...form, suburb: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>State *</label>
            <select
              style={inputStyle}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            >
              {STATES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address and postcode */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Street address</label>
            <input
              style={inputStyle}
              placeholder="e.g. 123 Church St"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Postcode</label>
            <input
              style={inputStyle}
              placeholder="e.g. 2150"
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
            />
          </div>
        </div>

        {/* Contact */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              placeholder="e.g. 0412 345 678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <input
              style={inputStyle}
              placeholder="e.g. 0412 345 678"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
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
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              style={inputStyle}
              placeholder="e.g. hello@mybusiness.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input
              type="url"
              style={inputStyle}
              placeholder="e.g. https://mybusiness.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
        </div>

        {/* Extra details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>ABN</label>
            <input
              style={inputStyle}
              placeholder="e.g. 12 345 678 901"
              value={form.abn}
              onChange={(e) => setForm({ ...form, abn: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Year established</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="e.g. 2018"
              value={form.established_year}
              onChange={(e) =>
                setForm({ ...form, established_year: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Operating hours</label>
          <input
            style={inputStyle}
            placeholder="e.g. Mon-Fri 9am-5pm, Sat 10am-3pm"
            value={form.operating_hours}
            onChange={(e) =>
              setForm({ ...form, operating_hours: e.target.value })
            }
          />
        </div>

        {/* Nepalese owned */}
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
            checked={form.is_nepalese_owned}
            onChange={(e) =>
              setForm({ ...form, is_nepalese_owned: e.target.checked })
            }
          />
          🇳🇵 This is a Nepalese-owned business
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? "#ccc" : "#E87722",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "13px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "4px",
          }}
        >
          {loading ? "Registering..." : "Register business →"}
        </button>

        <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center" }}>
          Your business will be listed immediately. NepSaathi admin may verify
          it after review.
        </p>
      </div>
    </div>
  );
}
