import { useState, useEffect } from "react";
import usePageMeta from "../hooks/usePageMeta";

const SECTIONS = [
  {
    id: "acceptance",
    short: "Acceptance of terms",
    title: "1. Acceptance of terms",
    content: `By accessing or using NepSaathi ("the platform"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our platform.\n\nNepSaathi is a community platform for the Nepalese diaspora in Australia and worldwide.`,
  },
  {
    id: "accounts",
    short: "User accounts",
    title: "2. User accounts",
    content: `To post listings or access contact details, you must create an account. You agree to:\n\n- Provide accurate and complete information when registering\n- Keep your password secure and not share it with others\n- Notify us immediately of any unauthorised use of your account\n- Be at least 18 years old to use this platform\n- One person may only maintain one account`,
  },
  {
    id: "posting",
    short: "Posting rules",
    title: "3. Posting rules",
    content: `When posting listings on NepSaathi, you must not:\n\n- Post false, misleading or fraudulent listings\n- Post the same listing multiple times (spam)\n- Post illegal content or illegal offers\n- Harass, threaten or abuse other users\n- Post content that discriminates based on race, religion, gender or other protected characteristics\n- Use the platform for pyramid schemes or multi-level marketing\n- Scrape or copy listings without permission\n\nViolation of these rules may result in immediate account suspension.`,
  },
  {
    id: "content",
    short: "Content ownership",
    title: "4. Content ownership",
    content: `You retain ownership of the content you post on NepSaathi. By posting, you grant NepSaathi a non-exclusive, worldwide licence to display your content on the platform.\n\nYou are solely responsible for the accuracy of your listings and any transactions that result from them.`,
  },
  {
    id: "prohibited",
    short: "Prohibited activities",
    title: "5. Prohibited activities",
    content: `You must not:\n\n- Attempt to hack, disrupt or damage the platform\n- Use automated tools to scrape or mass-post listings\n- Impersonate other users or businesses\n- Use the platform for any unlawful purpose\n- Attempt to circumvent our spam or rate limiting controls`,
  },
  {
    id: "disclaimer",
    short: "Disclaimer",
    title: "6. Disclaimer",
    content: `NepSaathi is a community platform and does not:\n\n- Verify the accuracy of listings posted by users\n- Guarantee the quality or legitimacy of any job, room or service listed\n- Take responsibility for any transactions between users\n- Endorse any business or individual listed on the platform\n\nAlways exercise your own judgement when responding to listings.`,
  },
  {
    id: "liability",
    short: "Limitation of liability",
    title: "7. Limitation of liability",
    content: `To the maximum extent permitted by law, NepSaathi shall not be liable for any indirect, incidental, special or consequential damages arising from your use of the platform.\n\nOur total liability to you shall not exceed the amount you have paid us in the past 12 months (if any).`,
  },
  {
    id: "termination",
    short: "Termination",
    title: "8. Termination",
    content: `We reserve the right to suspend or terminate your account at any time if you violate these terms or engage in behaviour that is harmful to the community.\n\nYou may delete your account at any time by contacting support@nepsaathi.com`,
  },
  {
    id: "changes",
    short: "Changes to terms",
    title: "9. Changes to terms",
    content: `We may update these terms from time to time. We will notify users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the new terms.`,
  },
  {
    id: "contact",
    short: "Contact us",
    title: "10. Contact us",
    content: `For questions about these Terms of Use, contact us at:`,
    links: [
      { label: "Email", value: "legal@nepsaathi.com", href: "mailto:legal@nepsaathi.com" },
      { label: "Website", value: "nepsaathi.com", href: "https://nepsaathi.com" },
    ],
  },
];

export default function TermsPage() {
  usePageMeta("Terms of Use", "Read NepSaathi's terms of use — the rules and guidelines for using our community platform.");
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
        .terms-layout  { display: grid; grid-template-columns: 224px 1fr; gap: 20px; align-items: start; }
        .terms-toc     { position: sticky; top: 72px; }
        .toc-btn       { display: block; width: 100%; text-align: left; background: none; border: none; padding: 7px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; transition: background 0.2s ease, color 0.2s ease, font-weight 0.2s ease; }
        .toc-btn:hover { background: #f0f0f0; }
        .terms-spacer  { height: 50vh; }
        @media (max-width: 760px) {
          .terms-layout { grid-template-columns: 1fr !important; }
          .terms-toc    { display: none; }
          .terms-spacer { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px 56px", background: "#F5F4F0", minHeight: "100vh" }}>

        {/* Hero */}
        <div style={{ background: "#26215C", borderRadius: "18px", padding: "36px 32px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(83,74,183,0.2)" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(83,74,183,0.15)" }} />
          <div style={{ position: "relative" }}>
            <span style={{ display: "inline-block", background: "#FFF1E0", border: "0.5px solid #EFD9C0", borderRadius: "20px", padding: "4px 14px", fontSize: "11px", color: "#633806", fontWeight: 600, marginBottom: "14px", letterSpacing: "0.03em" }}>
              LEGAL
            </span>
            <h1 style={{ fontSize: "30px", fontWeight: 700, color: "#fff", marginBottom: "8px", lineHeight: 1.2 }}>Terms of Use</h1>
            <p style={{ fontSize: "13px", color: "#AFA9EC", margin: "0 0 20px" }}>Last updated: April 2026</p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {[
                { icon: "📄", text: "10 sections" },
                { icon: "⚖️", text: "Governed by Australian law" },
                { icon: "📧", text: "legal@nepsaathi.com" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#AFA9EC", fontWeight: 500 }}>
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="terms-layout">

          {/* Sticky sidebar TOC */}
          <div className="terms-toc">
            <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "14px", padding: "16px 12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: "10px" }}>
                Contents
              </div>
              {SECTIONS.map(({ id, short }) => {
                const isActive = activeId === id;
                return (
                  <button
                    key={id}
                    className="toc-btn"
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
                        <a href={href} style={{ fontSize: "13.5px", color: "#534AB7", fontWeight: 600, textDecoration: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >{value}</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
        <div className="terms-spacer" />
      </div>
    </>
  );
}
