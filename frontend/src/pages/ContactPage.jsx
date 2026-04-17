import { useState } from "react";
import usePageTitle from "../hooks/usePageTitle";
import { useToast } from "../components/ui/Toast";

export default function ContactPage() {
  usePageTitle("Contact Us");
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      addToast("Please fill in all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      // Opens email client with pre-filled content
      window.location.href = `mailto:hello@nepsaathi.com?subject=${encodeURIComponent(form.subject || "NepSaathi Enquiry")}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
      addToast("Opening your email client...", "success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      addToast("Something went wrong. Please email us directly.", "error");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "#EEEDFE",
            border: "0.5px solid #AFA9EC",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "12px",
            color: "#534AB7",
            fontWeight: 500,
            marginBottom: "16px",
          }}
        >
          Get in touch
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#26215C",
            marginBottom: "8px",
          }}
        >
          Contact NepSaathi
        </h1>
        <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.7 }}>
          Have a question, feedback or need help? We'd love to hear from you.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            emoji: "✉️",
            label: "General enquiries",
            value: "hello@nepsaathi.com",
            href: "mailto:hello@nepsaathi.com",
          },
          {
            emoji: "🛠️",
            label: "Support",
            value: "support@nepsaathi.com",
            href: "mailto:support@nepsaathi.com",
          },
          {
            emoji: "🔒",
            label: "Privacy",
            value: "privacy@nepsaathi.com",
            href: "mailto:privacy@nepsaathi.com",
          },
          { emoji: "🇦🇺", label: "Based in", value: "Australia", href: null },
        ].map(({ emoji, label, value, href }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{emoji}</div>
            <div
              style={{
                fontSize: "11px",
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              {label}
            </div>
            {href ? (
              <a
                href={href}
                style={{
                  fontSize: "13px",
                  color: "#534AB7",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {value}
              </a>
            ) : (
              <div style={{ fontSize: "13px", color: "#333", fontWeight: 500 }}>
                {value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "20px",
          }}
        >
          Send us a message
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>Your name *</label>
              <input
                style={inputStyle}
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Subject</label>
            <input
              style={inputStyle}
              placeholder="What is this about?"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>Message *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              placeholder="Tell us how we can help..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={1000}
            />
            <p style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
              {form.message.length}/1000
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#ccc" : "#534AB7",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send message →"}
          </button>
        </form>
      </div>
    </div>
  );
}
