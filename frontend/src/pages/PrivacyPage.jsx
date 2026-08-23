import { useState, useEffect } from "react";
import { LockIcon, EnvelopeIcon } from "@phosphor-icons/react";
import usePageMeta from "../hooks/usePageMeta";

const SECTIONS = [
  {
    id: "intro",
    short: "Introduction",
    title: "1. Introduction",
    content: `NepSaathi ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform at nepsaathi.com.\n\nBy using NepSaathi, you agree to the collection and use of information in accordance with this policy.`,
  },
  {
    id: "collection",
    short: "Information we collect",
    title: "2. Information we collect",
    content: `We collect the following types of information:\n\n- Account information — your name, email address, and password when you register\n- Profile information — phone number, location, bio, and profile picture\n- Listing information — details of jobs, rooms, events, notices or businesses you post\n- Google account information — if you sign in with Google, we receive your name, email and profile picture\n- Usage data — how you interact with our platform, pages visited, and search queries`,
  },
  {
    id: "usage",
    short: "How we use your data",
    title: "3. How we use your information",
    content: `We use your information to:\n\n- Provide and improve the NepSaathi platform\n- Display your listings to other community members\n- Send you relevant notifications about your listings\n- Verify your identity and prevent fraud\n- Comply with legal obligations\n\nWe do not sell your personal information to third parties.`,
  },
  {
    id: "sharing",
    short: "Information sharing",
    title: "4. Information sharing",
    content: `We share your information only in these circumstances:\n\n- Public listings — your listing title, description, location and contact details are visible to other users\n- Contact details — phone, WhatsApp and email are only shown to logged-in users\n- Service providers — we use trusted third parties (Cloudinary for images, Google for authentication) who are bound by confidentiality agreements\n- Legal requirements — if required by law or to protect our rights`,
  },
  {
    id: "security",
    short: "Data security",
    title: "5. Data security",
    content: `We implement industry-standard security measures to protect your data:\n\n- All passwords are hashed and never stored in plain text\n- JWT tokens expire after 60 minutes\n- All data is transmitted over HTTPS\n- We regularly review and update our security practices\n\nHowever, no method of transmission over the internet is 100% secure.`,
  },
  {
    id: "rights",
    short: "Your rights",
    title: "6. Your rights",
    content: `You have the right to:\n\n- Access your personal data at any time via your Profile settings\n- Update or correct your information in Profile settings\n- Delete your account by contacting support@nepsaathi.com\n- Opt out of non-essential communications\n\nFor any privacy concerns, contact us at legal@nepsaathi.com`,
  },
  {
    id: "cookies",
    short: "Cookies",
    title: "7. Cookies",
    content: `NepSaathi uses minimal cookies and local storage to:\n\n- Keep you logged in between sessions\n- Remember your preferences\n\nWe do not use advertising cookies or tracking pixels.`,
  },
  {
    id: "contact",
    short: "Contact us",
    title: "8. Contact us",
    content: `If you have questions about this Privacy Policy, please contact us at:`,
    links: [
      { label: "Email", value: "legal@nepsaathi.com", href: "mailto:legal@nepsaathi.com" },
      { label: "Website", value: "nepsaathi.com", href: "https://nepsaathi.com" },
    ],
  },
];

export default function PrivacyPage() {
  usePageMeta("Privacy Policy", "Read NepSaathi's privacy policy — how we collect, use and protect your personal information.");
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observers = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-20% 0px -70% 0px" }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const scrollTo = (id) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{`
        .pp-layout  { display: grid; grid-template-columns: 224px 1fr; gap: 20px; align-items: start; }
        .pp-toc     { position: sticky; top: 72px; }
        .pp-btn     { display: block; width: 100%; text-align: left; background: none; border: none; padding: 7px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; transition: background 0.2s ease, color 0.2s ease; }
        .pp-btn:hover { background: #f0f0f0; }
        .pp-spacer  { height: 50vh; }
        @media (max-width: 760px) {
          .pp-layout { grid-template-columns: 1fr !important; }
          .pp-toc    { display: none; }
          .pp-spacer { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px 56px", background: "#F5F4F0", minHeight: "100vh" }}>

        {/* Hero */}
        <div style={{ background: "#26215C", borderRadius: "18px", padding: "36px 32px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(83,74,183,0.2)" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(83,74,183,0.15)" }} />
          <div style={{ position: "relative" }}>
            <span style={{ display: "inline-block", background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: "20px", padding: "4px 14px", fontSize: "11px", color: "#3C3489", fontWeight: 600, marginBottom: "14px", letterSpacing: "0.03em" }}>
              LEGAL
            </span>
            <h1 style={{ fontSize: "30px", fontWeight: 700, color: "#fff", marginBottom: "8px", lineHeight: 1.2 }}>Privacy Policy</h1>
            <p style={{ fontSize: "13px", color: "#AFA9EC", margin: "0 0 20px" }}>Last updated: April 2026</p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {[
                { Icon: LockIcon, text: "8 sections" },
                { icon: "🇦🇺", text: "Governed by Australian law" },
                { Icon: EnvelopeIcon, text: "legal@nepsaathi.com" },
              ].map(({ Icon, icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#AFA9EC", fontWeight: 500 }}>
                  {Icon ? <Icon size={13} weight="regular" color="#AFA9EC" /> : <span>{icon}</span>} {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pp-layout">

          {/* Sticky sidebar TOC */}
          <div className="pp-toc">
            <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "14px", padding: "16px 12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: "10px" }}>
                Contents
              </div>
              {SECTIONS.map(({ id, short }) => {
                const isActive = activeId === id;
                return (
                  <button
                    key={id}
                    className="pp-btn"
                    onClick={() => scrollTo(id)}
                    style={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#534AB7" : "#666",
                      background: isActive ? "#EEEDFE" : "transparent",
                    }}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "16px", overflow: "hidden" }}>
            {SECTIONS.map(({ id, title, content, links }, i) => (
              <div
                key={id}
                id={id}
                style={{
                  padding: "28px 32px",
                  borderBottom: i < SECTIONS.length - 1 ? "0.5px solid #f0f0f0" : "none",
                  scrollMarginTop: "88px",
                }}
              >
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#26215C", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#EEEDFE", border: "0.5px solid #AFA9EC", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#534AB7", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  {title.replace(/^\d+\.\s/, "")}
                </h2>
                <p style={{ fontSize: "13.5px", color: "#555", lineHeight: 1.85, whiteSpace: "pre-line", margin: links ? "0 0 14px" : 0 }}>
                  {content}
                </p>
                {links && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {links.map(({ label, value, href }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", width: "52px", flexShrink: 0 }}>{label}</span>
                        <a
                          href={href}
                          style={{ fontSize: "13.5px", color: "#534AB7", fontWeight: 600, textDecoration: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {value}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
        <div className="pp-spacer" />
      </div>
    </>
  );
}
