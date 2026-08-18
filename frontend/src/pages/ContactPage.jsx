import { useState } from "react";
import usePageMeta from "../hooks/usePageMeta";
import { useToast } from "../components/ui/Toast";
import { sendContactForm } from "../api/auth";

const FAQ = [
  {
    q: "How long does it take to get a response?",
    a: "We typically respond within 24 hours on weekdays. For urgent matters, email us directly at hello@nepsaathi.com.",
  },
  {
    q: "How do I report a listing or inappropriate content?",
    a: "Use the \"Report a problem\" subject in the form below, or email support@nepsaathi.com with the listing link.",
  },
  {
    q: "Can I advertise my business on NepSaathi?",
    a: "Yes! Select \"Business listing\" in the form or register directly via the + Post free ad button in the top navigation.",
  },
  {
    q: "Is NepSaathi only for Nepalese people in Australia?",
    a: "NepSaathi is built for the Nepalese community in Australia, but anyone looking for Nepalese-run services, events or community notices is welcome.",
  },
];

export default function ContactPage() {
  usePageMeta("Contact Us", "Get in touch with the NepSaathi team. We are here to help the Nepalese Australian community.");
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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
      addToast("Message sent successfully! We'll get back to you soon.", "success");
    } catch {
      addToast("Failed to send. Please email us at hello@nepsaathi.com", "error");
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

  const contactCards = [
    { emoji: "✉️", label: "General enquiries", value: "hello@nepsaathi.com", href: "mailto:hello@nepsaathi.com", bg: "#EEEDFE", border: "#AFA9EC", color: "#3C3489" },
    { emoji: "🛠️", label: "Technical support", value: "support@nepsaathi.com", href: "mailto:support@nepsaathi.com", bg: "#E1F5EE", border: "#9FE1CB", color: "#085041" },
    { emoji: "🔒", label: "Privacy concerns", value: "privacy@nepsaathi.com", href: "mailto:privacy@nepsaathi.com", bg: "#FFF1E0", border: "#EFD9C0", color: "#633806" },
  ];

  return (
    <>
      <style>{`
        .ct-body      { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
        .ct-grid2     { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ct-faq-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 820px) {
          .ct-body     { grid-template-columns: 1fr !important; }
          .ct-faq-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .ct-grid2    { grid-template-columns: 1fr !important; }
        }
        .ct-faq-item       { cursor: pointer; user-select: none; transition: background 0.2s; }
        .ct-faq-item:hover .ct-faq-q { color: #534AB7; }
        .ct-faq-body       { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.28s ease; }
        .ct-faq-body.open  { grid-template-rows: 1fr; }
        .ct-faq-body > div { overflow: hidden; min-height: 0; }
        .ct-faq-icon       { display: inline-block; transition: transform 0.25s ease, color 0.2s; line-height: 1; }
        .ct-faq-icon.open  { transform: rotate(45deg); }
      `}</style>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 24px 48px", background: "#F5F4F0", minHeight: "100vh" }}>

        {/* Hero */}
        <div style={{ background: "#26215C", borderRadius: "18px", padding: "40px 32px", marginBottom: "20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(83,74,183,0.25)" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "130px", height: "130px", borderRadius: "50%", background: "rgba(83,74,183,0.18)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-block", background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: "20px", padding: "4px 14px", fontSize: "11px", color: "#3C3489", fontWeight: 600, marginBottom: "14px", letterSpacing: "0.03em" }}>
              GET IN TOUCH
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: 700, color: "#fff", marginBottom: "10px", lineHeight: 1.2 }}>
              Contact NepSaathi
            </h1>
            <p style={{ fontSize: "14px", color: "#AFA9EC", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto 20px" }}>
              Have a question, feedback or need help? We'd love to hear from you. We typically respond within 24 hours.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
              {[
                { icon: "⏱", text: "24h response time" },
                { icon: "🇦🇺", text: "Based in Australia" },
                { icon: "💬", text: "Friendly support" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#AFA9EC", fontWeight: 500 }}>
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="ct-body" style={{ marginBottom: "20px" }}>

          {/* Left: info panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Contact channels */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ background: "#26215C", padding: "12px 18px" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#fff", margin: 0 }}>Contact channels</h2>
              </div>
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {contactCards.map(({ emoji, label, value, href, bg, border, color }) => (
                  <a
                    key={label}
                    href={href}
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", background: bg, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "12px 14px", transition: "transform 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{emoji}</span>
                    <div>
                      <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: "12px", color, fontWeight: 600 }}>{value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* What to expect */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ background: "#1D9E75", padding: "12px 18px" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#fff", margin: 0 }}>What to expect</h2>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { step: "1", title: "Send your message", desc: "Fill in the form or email us directly." },
                  { step: "2", title: "We review it", desc: "Our team reads every message carefully." },
                  { step: "3", title: "You hear back", desc: "We reply within 24 hours on weekdays." },
                ].map(({ step, title, desc }) => (
                  <div key={step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#EEEDFE", border: "0.5px solid #AFA9EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#534AB7", flexShrink: 0 }}>
                      {step}
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#26215C", marginBottom: "2px" }}>{title}</div>
                      <div style={{ fontSize: "11px", color: "#888", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community */}
            <div style={{ background: "#26215C", borderRadius: "14px", padding: "18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Join our community</div>
              <p style={{ fontSize: "12px", color: "#AFA9EC", lineHeight: 1.6, margin: "0 0 14px" }}>
                Connect with thousands of Nepalese Australians — find jobs, rooms, events and more.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Facebook", href: "https://www.facebook.com/nepsaathi/", bg: "#1877F2" },
                  { label: "Instagram", href: "https://www.instagram.com/nepsaathi/", bg: "#E1306C" },
                ].map(({ label, href, bg }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: bg, color: "#fff", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {sent ? (
              <div style={{ background: "#fff", border: "0.5px solid #9FE1CB", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ background: "#1D9E75", padding: "14px 20px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", margin: 0 }}>Message sent!</h2>
                </div>
                <div style={{ padding: "56px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                  <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, marginBottom: "24px", maxWidth: "380px", margin: "0 auto 24px" }}>
                    Thanks for reaching out! We'll get back to you within 24 hours at your email address.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: "9px", padding: "11px 24px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ background: "#26215C", padding: "14px 20px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", margin: 0 }}>Send us a message</h2>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="ct-grid2">
                    <div>
                      <label style={labelStyle}>Your name *</label>
                      <input style={inputStyle} placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email *</label>
                      <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Subject</label>
                    <select style={inputStyle} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
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

                  <div>
                    <label style={labelStyle}>Message *</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
                      placeholder="Tell us how we can help..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      maxLength={1000}
                    />
                    <div style={{ fontSize: "11px", color: form.message.length > 900 ? "#E87722" : "#ccc", marginTop: "4px", textAlign: "right" }}>
                      {form.message.length}/1000
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ background: loading ? "#ccc" : "#534AB7", color: "#fff", border: "none", borderRadius: "9px", padding: "13px", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
                  >
                    {loading ? "Sending..." : "Send message →"}
                  </button>

                  <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", margin: 0 }}>
                    Or email us directly at{" "}
                    <a href="mailto:hello@nepsaathi.com" style={{ color: "#534AB7", fontWeight: 500, textDecoration: "none" }}>
                      hello@nepsaathi.com
                    </a>
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ background: "#26215C", padding: "14px 20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", margin: 0 }}>Frequently asked questions</h2>
          </div>
          <div className="ct-faq-grid" style={{ padding: "16px" }}>
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="ct-faq-item"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{ border: `0.5px solid ${isOpen ? "#AFA9EC" : "#eee"}`, borderRadius: "12px", padding: "14px 16px", background: isOpen ? "#EEEDFE" : "#fafafa" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div className="ct-faq-q" style={{ fontSize: "13px", fontWeight: 600, color: isOpen ? "#534AB7" : "#26215C", lineHeight: 1.4, transition: "color 0.2s" }}>
                      {item.q}
                    </div>
                    <span className={`ct-faq-icon${isOpen ? " open" : ""}`} style={{ fontSize: "18px", color: isOpen ? "#534AB7" : "#bbb", flexShrink: 0 }}>+</span>
                  </div>
                  <div className={`ct-faq-body${isOpen ? " open" : ""}`}>
                    <div>
                      <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, margin: "10px 0 0" }}>{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
