import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

const sections = [
  {
    id: "medicare",
    icon: "🏥",
    title: "Medicare — What's Covered",
    summary: "Medicare is Australia's universal health system. Eligibility depends on your visa.",
    steps: [
      "Australian citizens, permanent residents, and citizens of eligible countries (Nepal is NOT on the list) are covered by Medicare.",
      "Eligible visa holders: 482 (TSS) and most sponsored work visas, student visas from reciprocal countries (not Nepal).",
      "Most Nepali migrants on temporary visas are NOT covered by Medicare — you need private health insurance or OSHC.",
      "To enrol in Medicare (if eligible), visit a Medicare centre with your passport, visa grant letter, and proof of address.",
      "Medicare covers: GP visits (bulk billed or with gap), hospital as a public patient, some allied health (with referral), most pathology and radiology.",
      "Medicare does NOT cover: dental, optical, most physiotherapy, ambulance, private hospital gap fees.",
    ],
    link: { label: "Check your Medicare eligibility — Services Australia", url: "https://www.servicesaustralia.gov.au/who-can-get-medicare" },
    tip: "Even if you're eligible, you must actively enrol in Medicare — it doesn't happen automatically. Visit a service centre with your documents.",
  },
  {
    id: "private-health",
    icon: "🛡️",
    title: "Private Health Insurance",
    summary: "Private health covers what Medicare doesn't, and is essential if you're not Medicare eligible.",
    steps: [
      "Private health has two components: hospital cover (private room, choice of specialist) and extras/ancillary cover (dental, optical, physio).",
      "If you're on a temporary visa without Medicare eligibility, hospital cover is legally required to avoid large out-of-pocket costs.",
      "Top private health insurers in Australia: Medibank, Bupa, HCF, nib, AHM — compare on privatehealth.gov.au.",
      "Waiting periods apply for most extras (2–12 months) and some hospital covers (12 months for pre-existing conditions).",
      "Lifetime Health Cover (LHC) loading: if you don't get hospital cover by age 31, you pay a 2% loading for every year you were without it when you do eventually take it out.",
      "Australian Resident cards (Medibank, BUPA) don't apply to temporary visa holders — you need a product specifically covering your visa type.",
    ],
    link: { label: "Compare health insurance — privatehealth.gov.au", url: "https://www.privatehealth.gov.au/healthinsurance/howitworks/comparetable.htm" },
    tip: "When comparing, check the 'excess' (the amount you pay per hospital stay) and the specific list of hospitals your fund covers in your city.",
  },
  {
    id: "oshc",
    icon: "🎓",
    title: "OSHC — Overseas Student Health Cover",
    summary: "Mandatory for international students — must be purchased before your visa is granted.",
    steps: [
      "OSHC (Overseas Student Health Cover) is a legal requirement for all student visa holders. Your university or college often arranges it for you.",
      "Approved OSHC providers: Medibank, Bupa, AHM, nib, CBHS Corporate Health — they all meet the same minimum benefit requirements.",
      "OSHC covers: doctor visits, some hospital treatment, limited pharmaceuticals (up to the PBS schedule).",
      "OSHC does NOT cover: dental (except emergency extractions), optical, physiotherapy, chiropractic — these need extras cover.",
      "OSHC covers your entire visa duration — if your visa is extended, extend your OSHC immediately to avoid a gap in cover.",
      "If your university arranged OSHC, check exactly what's covered — some institutional arrangements have lower benefit limits.",
    ],
    link: { label: "Understand OSHC coverage — OSHC World Care", url: "https://oshcworldcare.com.au/what-is-oshc/" },
    tip: "You can switch OSHC providers during your course — you're not locked into the one your institution recommends. Compare and switch for better coverage.",
  },
  {
    id: "gp",
    icon: "🩺",
    title: "Finding a Doctor (GP)",
    summary: "Your GP is your first point of contact for almost all health issues in Australia.",
    steps: [
      "GPs (General Practitioners) are your first contact — they refer you to specialists and manage ongoing conditions.",
      "Bulk billing means the GP charges Medicare directly — your cost is $0. Not all GPs bulk bill all patients.",
      "To find bulk billing GPs near you: use healthdirect.gov.au GP finder and filter by 'bulk billing'.",
      "Some Nepali community GPs speak Nepali — ask on the NepSaathi forum for recommendations in your city.",
      "For after-hours care: call 13SICK (13 7425) for a home visit, or visit a 24-hour medical centre.",
      "Telehealth: many GPs offer video/phone consultations — increasingly common and often bulk billed.",
    ],
    link: { label: "Find a GP near you — Healthdirect", url: "https://www.healthdirect.gov.au/australian-health-services" },
    tip: "Register with one regular GP practice rather than going to different clinics each time — your GP builds your medical history and knows your background.",
  },
  {
    id: "mental-health",
    icon: "🧠",
    title: "Mental Health Support",
    summary: "Australia has strong mental health support — don't hesitate to seek help.",
    steps: [
      "Your GP can refer you to a psychologist under a Mental Health Treatment Plan — gives you 10 sessions per year significantly subsidised by Medicare.",
      "Without Medicare, psychologist costs are typically $150–$300 per session privately.",
      "Free national services: Lifeline 13 11 14 (24/7 crisis), Beyond Blue 1300 22 4636, Headspace (for under 25s).",
      "Many universities offer free counselling services for students — usually 3–6 sessions per semester.",
      "SANE Australia offers support specifically for complex mental illness — sane.org.",
      "Culture shock, homesickness, and migration stress are real — talking to a counsellor is a sign of strength, not weakness.",
    ],
    link: { label: "Find mental health support — Beyond Blue", url: "https://www.beyondblue.org.au/get-support/find-a-mental-health-professional" },
    tip: "If you're struggling with homesickness or migration anxiety, you're not alone. The Nepali community in Australia is a strong support network — join local community groups.",
  },
  {
    id: "dental-optical",
    icon: "🦷",
    title: "Dental, Optical and Allied Health",
    summary: "Medicare doesn't cover these — plan ahead with extras insurance or savings.",
    steps: [
      "Dental: NOT covered by Medicare. A basic check-up and clean costs $150–$300. Fillings $150–$400. Emergency extraction $200+.",
      "Dental emergencies: Hospital emergency dental (public) is free but only for severe pain/swelling. Waiting lists for public dental can be years long.",
      "Student dental clinics at universities often offer discounted services performed by supervised final-year students.",
      "Optical: NOT covered by Medicare. Glasses frames $100–$600+. Lenses extra. Annual eye test (optometrist) is bulk billed by Medicare.",
      "Physiotherapy, chiropractic: NOT covered by Medicare unless specifically referred and under allied health plan.",
      "If you have private health extras cover, keep all receipts — most extras are refundable up to your annual limit.",
    ],
    link: { label: "Find a dentist — Australian Dental Association", url: "https://www.ada.org.au/find-a-dentist" },
    tip: "Consider a health insurance policy with extras from day one — dental emergencies are common and very expensive without cover.",
  },
  {
    id: "pharmacy",
    icon: "💊",
    title: "Pharmacy and the PBS",
    summary: "Australia's Pharmaceutical Benefits Scheme (PBS) makes many medications highly affordable.",
    steps: [
      "PBS (Pharmaceutical Benefits Scheme) subsidises prescription medications for Medicare-eligible patients — co-payment is capped at around $7.70 (concessional) or $31.60 (general) per item.",
      "If you're not Medicare eligible, prescriptions are charged at the full price — often $50–$200 per item.",
      "Over-the-counter medications: available at pharmacies without prescription. Chemist Warehouse and Priceline are the most affordable chains.",
      "Bring any ongoing prescriptions from Nepal with a letter from your Nepali doctor — your Australian GP can review and re-prescribe locally.",
      "Some medications legal in Nepal are controlled substances in Australia — check the Therapeutic Goods Administration (TGA) before bringing them.",
      "Emergency contraception, antifungals, and many common medications are available over-the-counter (OTC) without prescription.",
    ],
    link: { label: "Check if a medication is on the PBS — PBS.gov.au", url: "https://www.pbs.gov.au/pbs/home" },
    tip: "You don't need to go to the nearest pharmacy — prices vary significantly. Chemist Warehouse is almost always the cheapest option for over-the-counter items.",
  },
];

export default function HealthPage() {
  usePageMeta(
    "Health & Insurance Guide for Nepalis in Australia",
    "Complete guide to Medicare, private health insurance, OSHC, mental health, dental, optical, and finding a doctor for Nepali migrants in Australia."
  );
  const [open, setOpen] = useState(null);
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const navRef = useRef(null);

  const toggle = (id) => setOpen((prev) => (prev === id ? null : id));

  useEffect(() => {
    const observers = [];
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(s.id); },
        { threshold: 0.2, rootMargin: "-100px 0px -55% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const btn = navRef.current.querySelector(`[data-id="${activeSection}"]`);
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  const scrollToSection = (id) => {
    setOpen(id);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const offset = 56 + 46;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }, 20);
  };

  const accent = "#0369A1";
  const accentLight = "#E0F2FE";
  const accentBorder = "#7DD3FC";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg, #0369A1 0%, #0284C7 60%, #0EA5E9 100%)", padding: "56px 24px 48px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🏥🛡️</div>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          Health &amp; Insurance in Australia
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", opacity: 0.9, maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Medicare, private health insurance, OSHC for students, mental health, dental and finding a doctor — what every Nepali migrant needs to know.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/new-to-australia" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            New to Australia Guide
          </Link>
          <Link to="/forum" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            Ask the Community
          </Link>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: "56px", zIndex: 90 }}>
        <style>{`.health-nav::-webkit-scrollbar{display:none}`}</style>
        <div ref={navRef} className="health-nav" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px 2px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} data-id={s.id} onClick={() => scrollToSection(s.id)} style={{ background: "none", border: "none", boxShadow: isActive ? `inset 0 -2px 0 0 ${accent}` : "none", padding: "13px 12px", fontSize: "12px", fontWeight: 600, color: isActive ? accent : "#64748b", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s, border-color 0.15s" }}>
                {s.icon} {s.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sections.map((s) => {
            const isOpen = open === s.id;
            return (
              <div key={s.id} id={s.id} style={{ background: "#fff", border: `1.5px solid ${isOpen ? accent : "#e8eaf0"}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button onClick={() => toggle(s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: "24px", flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "2px" }}>{s.title}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.4 }}>{s.summary}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                      <ol style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }}>
                        {s.steps.map((step, i) => <li key={i} style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>{step}</li>)}
                      </ol>
                      <div style={{ marginTop: "16px", background: accentLight, border: `1px solid ${accentBorder}`, borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
                        <span style={{ fontSize: "13px", color: accent, lineHeight: 1.55 }}>{s.tip}</span>
                      </div>
                      {s.link.url.startsWith("/") ? (
                        <Link to={s.link.url} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "13px", fontWeight: 600, color: accent, textDecoration: "none" }}>
                          {s.link.label}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </Link>
                      ) : (
                        <a href={s.link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "13px", fontWeight: 600, color: accent, textDecoration: "none" }}>
                          {s.link.label}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "40px", background: "linear-gradient(135deg, #0369A1, #0284C7)", borderRadius: "16px", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>🤝</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Health question for the community?</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>Nepali doctors, nurses, and healthcare professionals in Australia are active on the NepSaathi forum.</p>
          <Link to="/forum" style={{ display: "inline-block", background: "#fff", color: accent, borderRadius: "8px", padding: "12px 24px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Ask on the Forum</Link>
        </div>
      </div>
    </div>
  );
}
