import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import {
  IdentificationCardIcon,
  HospitalIcon,
  BankIcon,
  ClipboardTextIcon,
  HouseIcon,
  StethoscopeIcon,
  CarIcon,
  HandshakeIcon,
  LightbulbIcon,
} from "@phosphor-icons/react";

const sections = [
  {
    id: "tfn",
    Icon: IdentificationCardIcon,
    title: "Tax File Number (TFN)",
    summary: "You need a TFN to work legally and pay the right amount of tax.",
    steps: [
      "Apply online at the ATO website (ato.gov.au) — it's free.",
      "You need an Australian residential address and proof of identity (passport + visa).",
      "TFN arrives by post in 10–28 days. Keep it private — never share it unnecessarily.",
      "Without a TFN, employers must withhold tax at the highest rate (47%).",
      "Students on a student visa can work up to 48 hours per fortnight while your course is in session.",
    ],
    link: { label: "Apply for TFN on ATO website", url: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" },
    tip: "Your TFN is yours for life — it doesn't change even if you change visa or become a citizen.",
  },
  {
    id: "medicare",
    Icon: HospitalIcon,
    title: "Medicare",
    summary: "Medicare gives you access to free or low-cost healthcare in Australia.",
    steps: [
      "Students on a student visa from eligible countries (including Nepal) may be enrolled in OSHC (Overseas Student Health Cover) through their university — check with your institution.",
      "Temporary skilled visa holders (subclass 482, 400, etc.) from Nepal can access Medicare under the Reciprocal Health Care Agreement (RHCA). Visit a Medicare office with your passport and visa.",
      "Permanent residents and citizens: enrol at any Service NSW / Medicare office or online via myGov.",
      "Once enrolled, you get a Medicare card within 2–4 weeks.",
      "With Medicare, you pay nothing for public hospital treatment and bulk-billed GP visits.",
    ],
    link: { label: "Find a Medicare office near you", url: "https://www.servicesaustralia.gov.au/where-to-access-our-services" },
    tip: "Nepal has a reciprocal health agreement with Australia — check if your visa type is eligible before paying for private health cover you might not need.",
  },
  {
    id: "bank",
    Icon: BankIcon,
    title: "Opening a Bank Account",
    summary: "You can open an Australian bank account before you even arrive.",
    steps: [
      "Most major banks (Commonwealth, ANZ, NAB, Westpac) let you apply online from Nepal and activate in-branch once you land.",
      "You'll need: passport, visa, Australian address, and TFN (optional at first but add it to avoid withholding tax on savings).",
      "Student-friendly options: CommBank Student Banking, ANZ Access Advantage — both have no monthly fees.",
      "For international transfers to Nepal, use Wise or your Nepali bank's remittance service for better rates than bank wire transfers.",
      "Set up internet banking immediately — most Australian employers pay by direct deposit.",
    ],
    link: { label: "Compare rates for sending money to Nepal", url: "/send-money" },
    tip: "Don't carry large amounts of cash. Set up a debit card linked to your Australian account as your first step.",
  },
  {
    id: "visa",
    Icon: ClipboardTextIcon,
    title: "Your Visa & Work Rights",
    summary: "Know exactly how many hours you can work and what's allowed on your visa.",
    steps: [
      "Student visa (subclass 500): up to 48 hours per fortnight while your course is in session. Unlimited hours during official university breaks.",
      "Graduate visa (subclass 485): full work rights, no hour restrictions.",
      "Skilled/sponsored visas (482, 186 etc.): full work rights, tied to your sponsor employer — changing jobs has rules.",
      "Working Holiday (417/462): can work for any employer, but maximum 6 months with the same employer in the same occupation.",
      "Check your visa conditions at immi.homeaffairs.gov.au — type in your visa subclass number.",
      "Working more hours than allowed is a visa breach and can lead to cancellation.",
    ],
    link: { label: "Check your visa conditions on DIBP", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing" },
    tip: "The Fair Work Ombudsman protects all workers in Australia, regardless of visa status. If your employer is underpaying you, you can report it anonymously.",
  },
  {
    id: "rental",
    Icon: HouseIcon,
    title: "Renting in Australia",
    summary: "Understand your rights as a tenant before signing any lease.",
    steps: [
      "You have rights under state tenancy law. NSW: NSW Fair Trading. VIC: Consumer Affairs Victoria. QLD: Residential Tenancies Authority.",
      "A lease (rental agreement) is a legal contract. Read it before signing. Ask questions.",
      "Bond is typically 4 weeks' rent. It must be lodged with the state bond authority — not kept by the landlord.",
      "Landlords cannot enter without proper notice (usually 24 hours for inspections, 7 days for non-urgent repairs).",
      "If a landlord asks for rent in cash only with no receipt, that is a red flag — always get a receipt or pay by bank transfer.",
      "For informal share house arrangements (common in the Nepali community), always agree on who pays utilities and what happens if someone leaves early — preferably in writing.",
    ],
    link: { label: "Find rooms to rent on NepSaathi", url: "/rooms" },
    tip: "Never pay bond or rent before inspecting the property in person or via video call. Scam listings exist — always verify.",
  },
  {
    id: "gp",
    Icon: StethoscopeIcon,
    title: "Finding a Nepali-Friendly GP",
    summary: "Access to a doctor who understands your background makes a real difference.",
    steps: [
      "Use healthdirect.gov.au to find GPs near you who bulk-bill (no out-of-pocket cost if you have Medicare).",
      "Ask in community Facebook groups or on the NepSaathi forum — many Nepali GPs are known within the community.",
      "Mental health: you can get a Mental Health Care Plan from your GP for up to 10 free psychology sessions under Medicare. Don't hesitate to ask.",
      "Dental and optical care are NOT covered by Medicare. Look into private health insurance or discounted clinics near universities.",
      "In an emergency, go to the nearest hospital emergency department. Emergency care is free for Medicare card holders.",
    ],
    link: { label: "Ask the community on the forum", url: "/forum" },
    tip: "Call 000 for life-threatening emergencies. Call 13 HEALTH (13 43 25 84) for free health advice 24/7.",
  },
  {
    id: "licence",
    Icon: CarIcon,
    title: "Driver's Licence",
    summary: "You can drive on your Nepali licence for a limited time after arriving.",
    steps: [
      "In most states, you can drive on your overseas licence for 3 months from arrival.",
      "After 3 months, you must get an Australian licence. NSW: go to a Service NSW centre. VIC: VicRoads. QLD: TMR.",
      "Nepal does NOT have a licence exchange agreement with Australia — you must sit the knowledge (theory) test and then a driving test.",
      "Learner driver rules apply: you may need to hold an L plate, drive with a supervisor, and log hours depending on your state.",
      "Study the road rules handbook for your state before your knowledge test — it's free online.",
    ],
    link: { label: "NSW Driver Licence info", url: "https://www.service.nsw.gov.au/transaction/apply-for-driver-licence" },
    tip: "If your Nepali licence is in Nepali/Devanagari script, get an official English translation before arriving — some states require it.",
  },
  {
    id: "community",
    Icon: HandshakeIcon,
    title: "Connecting with the Nepali Community",
    summary: "You are not alone — the Nepali community in Australia is large and welcoming.",
    steps: [
      "Join local Nepali community groups on Facebook for your city (search 'Nepali in Sydney', 'Nepali in Melbourne', etc.).",
      "NepSaathi forums are a great place to ask questions, find flatmates, look for jobs, and share advice.",
      "NRNA Australia (Non-Resident Nepali Association) organises events and community support — find your state chapter.",
      "Dashain, Tihar, and Teej events are held in all major cities each year — a great way to meet people and feel at home.",
      "Post a free listing on NepSaathi if you are looking for a room, a job, or offering a service.",
    ],
    link: { label: "Browse the NepSaathi forum", url: "/forum" },
    tip: "The community is your biggest asset. If you are struggling, reach out — someone has almost certainly been in the same situation.",
  },
];

export default function NewToAustraliaPage() {
  usePageMeta("New to Australia Guide", "Complete guide for Nepalese migrants moving to Australia — visas, Medicare, tax, banking, driving licence and more on NepSaathi.");
  const [open, setOpen] = useState(null);
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const navRef = useRef(null);

  const toggle = (id) => setOpen((prev) => (prev === id ? null : id));

  // Track which section is visible as the user scrolls
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

  // Keep the active tab visible inside the scrollable nav bar (important on mobile)
  useEffect(() => {
    if (!navRef.current) return;
    const btn = navRef.current.querySelector(`[data-id="${activeSection}"]`);
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  const scrollToSection = (id) => {
    setOpen(id); // expand accordion
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const offset = 56 + 46; // main navbar + quick nav height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }, 20); // small delay so accordion opens before measuring position
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #6C3FD6 0%, #4F46E5 60%, #3B82F6 100%)",
          padding: "56px 24px 48px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🇦🇺🇳🇵</div>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          New to Australia?
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", opacity: 0.9, maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Everything you need to know to get started in Australia — TFN, Medicare, bank accounts, rental rights, driver's licence, and more.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/jobs"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px 20px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Browse Jobs
          </Link>
          <Link
            to="/rooms"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px 20px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Find a Room
          </Link>
        </div>
      </div>

      {/* Quick nav — sticky below main navbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: "56px", zIndex: 90 }}>
        <style>{`.australia-nav::-webkit-scrollbar{display:none}`}</style>
        <div
          ref={navRef}
          className="australia-nav"
          style={{
            display: "flex",
            gap: "0",
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 8px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                data-id={s.id}
                onClick={() => scrollToSection(s.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "#6C3FD6" : "transparent"}`,
                  padding: "13px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: isActive ? "#6C3FD6" : "#64748b",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "color 0.15s, border-color 0.15s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = "#4F46E5"; e.currentTarget.style.borderBottomColor = "#4F46E5"; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderBottomColor = "transparent"; } }}
              >
                {s.Icon && <s.Icon size={14} weight="regular" style={{ flexShrink: 0 }} />}{s.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sections.map((s) => {
            const isOpen = open === s.id;
            return (
              <div
                key={s.id}
                id={s.id}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${isOpen ? "#6C3FD6" : "#e8eaf0"}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header */}
                <button
                  onClick={() => toggle(s.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "18px 20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {s.Icon && <s.Icon size={28} weight="duotone" color="#6C3FD6" style={{ flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "2px" }}>{s.title}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.4 }}>{s.summary}</div>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Body */}
                {isOpen && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                      <ol style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }}>
                        {s.steps.map((step, i) => (
                          <li key={i} style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>
                            {step}
                          </li>
                        ))}
                      </ol>

                      {/* Tip */}
                      <div
                        style={{
                          marginTop: "16px",
                          background: "#f5f3ff",
                          border: "1px solid #e9d5ff",
                          borderRadius: "8px",
                          padding: "12px 14px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <LightbulbIcon size={18} weight="fill" color="#6d28d9" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "#6d28d9", lineHeight: 1.55 }}>{s.tip}</span>
                      </div>

                      {/* Link */}
                      {s.link.url.startsWith("/") ? (
                        <Link
                          to={s.link.url}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#6C3FD6",
                            textDecoration: "none",
                          }}
                        >
                          {s.link.label}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </Link>
                      ) : (
                        <a
                          href={s.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#6C3FD6",
                            textDecoration: "none",
                          }}
                        >
                          {s.link.label}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "40px",
            background: "linear-gradient(135deg, #6C3FD6, #4F46E5)",
            borderRadius: "16px",
            padding: "32px 24px",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <HandshakeIcon size={40} weight="duotone" color="#fff" style={{ marginBottom: "12px", opacity: 0.85 }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Have a question not answered here?</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>
            Ask the NepSaathi community — thousands of Nepali Australians are happy to help.
          </p>
          <Link
            to="/forum"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#6C3FD6",
              borderRadius: "8px",
              padding: "12px 24px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Ask on the Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
