import { useState } from "react";
import usePageTitle from "../hooks/usePageTitle";
import { useToast } from "../components/ui/Toast";
import { sendContactForm } from "../api/auth";

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
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      addToast("Please fill in all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      await sendContactForm(form);
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      addToast(
        "Message sent successfully! We'll get back to you soon.",
        "success",
      );
    } catch {
      addToast(
        "Failed to send. Please email us at hello@nepsaathi.com",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "0.5px solid #ddd",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    outline: "none",
    background: "#fff",
    color: "#26215C",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#555",
    display: "block",
    marginBottom: "5px",
  };

  return (
    <>
      <style>{`
        .ct-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ct-cards  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 600px) {
          .ct-grid2 { grid-template-columns: 1fr !important; }
          .ct-cards  { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Dark hero banner ── */}
        <div
          style={{
            background: "#26215C",
            borderRadius: "16px",
            padding: "32px 28px",
            marginBottom: "14px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#EEEDFE",
              border: "0.5px solid #AFA9EC",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "11px",
              color: "#3C3489",
              fontWeight: 600,
              marginBottom: "14px",
              letterSpacing: "0.03em",
            }}
          >
            GET IN TOUCH
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "10px",
              lineHeight: 1.2,
            }}
          >
            Contact NepSaathi
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#AFA9EC",
              lineHeight: 1.7,
              maxWidth: "460px",
              margin: "0 auto",
            }}
          >
            Have a question, feedback or need help? We'd love to hear from you.
            We typically respond within 24 hours.
          </p>
        </div>

        {/* ── Contact info cards ── */}
        <div className="ct-cards" style={{ marginBottom: "14px" }}>
          {[
            {
              emoji: "✉️",
              label: "General",
              value: "hello@nepsaathi.com",
              href: "mailto:hello@nepsaathi.com",
              bg: "#EEEDFE",
              border: "#AFA9EC",
              color: "#3C3489",
            },
            {
              emoji: "🛠️",
              label: "Support",
              value: "support@nepsaathi.com",
              href: "mailto:support@nepsaathi.com",
              bg: "#E1F5EE",
              border: "#9FE1CB",
              color: "#085041",
            },
            {
              emoji: "🔒",
              label: "Privacy",
              value: "privacy@nepsaathi.com",
              href: "mailto:privacy@nepsaathi.com",
              bg: "#FFF1E0",
              border: "#EFD9C0",
              color: "#633806",
            },
            {
              emoji: "🇦🇺",
              label: "Based in",
              value: "Australia",
              href: null,
              bg: "#F5F4F0",
              border: "#e5e5e5",
              color: "#444",
            },
          ].map(({ emoji, label, value, href, bg, border, color }) => (
            <div
              key={label}
              style={{
                background: bg,
                border: `0.5px solid ${border}`,
                borderRadius: "12px",
                padding: "18px 14px",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>
                {emoji}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
              {href ? (
                <a
                  href={href}
                  style={{
                    fontSize: "11px",
                    color,
                    fontWeight: 600,
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  {value}
                </a>
              ) : (
                <div style={{ fontSize: "12px", color, fontWeight: 600 }}>
                  {value}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Success state ── */}
        {sent ? (
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #9FE1CB",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "#1D9E75", padding: "14px 20px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                }}
              >
                Message sent!
              </h2>
            </div>
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                  maxWidth: "380px",
                  margin: "0 auto 24px",
                }}
              >
                Thanks for reaching out! We'll get back to you within 24 hours
                at your email address.
              </p>
              <button
                onClick={() => setSent(false)}
                style={{
                  background: "#1D9E75",
                  color: "#fff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "11px 24px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Send another message
              </button>
            </div>
          </div>
        ) : (
          /* ── Contact form ── */
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "#26215C", padding: "14px 20px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                }}
              >
                Send us a message
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Name + Email */}
              <div className="ct-grid2">
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
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={labelStyle}>Subject</label>
                <select
                  style={inputStyle}
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                >
                  <option value="">Select a topic...</option>
                  <option value="General enquiry">General enquiry</option>
                  <option value="Report a problem">Report a problem</option>
                  <option value="My listing">My listing</option>
                  <option value="Account issue">Account issue</option>
                  <option value="Business listing">Business listing</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: "130px",
                    resize: "vertical",
                  }}
                  placeholder="Tell us how we can help..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  maxLength={1000}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: form.message.length > 900 ? "#E87722" : "#ccc",
                    marginTop: "4px",
                    textAlign: "right",
                  }}
                >
                  {form.message.length}/1000
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "#ccc" : "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "13px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Sending..." : "Send message →"}
              </button>

              <p
                style={{
                  fontSize: "12px",
                  color: "#aaa",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Or email us directly at{" "}
                <a
                  href="mailto:hello@nepsaathi.com"
                  style={{
                    color: "#534AB7",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  hello@nepsaathi.com
                </a>
              </p>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
