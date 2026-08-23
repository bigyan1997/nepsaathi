import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import {
  ClipboardTextIcon,
  CurrencyDollarIcon,
  ScalesIcon,
  WarningIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  LightbulbIcon,
  HandshakeIcon,
} from "@phosphor-icons/react";

const sections = [
  {
    id: "visa-conditions",
    Icon: ClipboardTextIcon,
    title: "Your Visa Work Conditions",
    summary: "Your visa determines how many hours you can work — breaching conditions can cost you your visa.",
    steps: [
      "Student visa (subclass 500): 48 hours per fortnight during term. Unlimited hours during official university breaks.",
      "Graduate visa (subclass 485): full work rights, no hour restrictions.",
      "Skilled work visas (482 TSS, 186, 189, 190): full work rights, but typically tied to a specific employer and occupation.",
      "Visitor visa (subclass 600): generally NO work allowed, with limited exceptions.",
      "Working holiday visa (417/462): full work rights but limited to 6 months with any single employer.",
      "Check your exact conditions on your visa grant notice or at immi.homeaffairs.gov.au — conditions vary even within the same visa subclass.",
    ],
    link: { label: "Check your visa conditions — IMMI", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder" },
    tip: "The 48-hour student visa fortnightly limit applies regardless of how many jobs you have — the total across all employers counts.",
  },
  {
    id: "minimum-wage",
    Icon: CurrencyDollarIcon,
    title: "Minimum Wage and Pay Rates",
    summary: "The national minimum wage applies to every worker in Australia — regardless of visa or nationality.",
    steps: [
      "National minimum wage (2024–25): $24.10 per hour (updated 1 July each year by the Fair Work Commission).",
      "Casual employees receive a 25% casual loading on top of the minimum wage — compensating for no paid leave.",
      "Weekend and public holiday penalty rates apply in many industries. Check your Award at fairwork.gov.au.",
      "Modern Awards set industry-specific minimum rates — many are higher than the base minimum wage.",
      "Your employer CANNOT pay you less than the minimum wage, regardless of any agreement you signed.",
      "If paid in cash, you're still entitled to the minimum wage and super. Cash payment doesn't exempt employers from obligations.",
    ],
    link: { label: "Check the current minimum wage — Fair Work", url: "https://www.fairwork.gov.au/pay-and-wages/minimum-wages" },
    tip: "Use the Fair Work Pay Calculator (fairwork.gov.au) to check exactly what you should be paid based on your industry, age, and employment type.",
  },
  {
    id: "fair-work",
    Icon: ScalesIcon,
    title: "Fair Work Act — Your Rights",
    summary: "The Fair Work Act protects all workers in Australia, regardless of visa status.",
    steps: [
      "You are entitled to 10 National Employment Standards (NES) regardless of your contract, award, or visa.",
      "NES includes: maximum 38 ordinary hours per week, annual leave (4 weeks paid), personal/carer's leave (10 days paid), parental leave, public holidays.",
      "Casual employees don't get paid leave but accrue entitlements and may request conversion to permanent after 6–12 months.",
      "Your employer cannot take back wages already earned — attempting to do so is 'wage theft' and is a criminal offence in most states.",
      "You can check your employment status (employee vs independent contractor) using Fair Work's tools — misclassification as contractor to avoid entitlements is illegal.",
      "Unions in Australia are powerful and can provide free advice and representation — consider joining the relevant union for your industry.",
    ],
    link: { label: "Know your rights — Fair Work Ombudsman", url: "https://www.fairwork.gov.au/employee-entitlements/national-employment-standards" },
    tip: "The Fair Work Ombudsman investigates complaints for free. You don't need a lawyer to lodge a complaint — and your immigration status does NOT disqualify you.",
  },
  {
    id: "exploitation",
    Icon: WarningIcon,
    title: "Underpayment and Workplace Exploitation",
    summary: "Exploitation of migrant workers is a serious and prosecuted crime in Australia — report it.",
    steps: [
      "Common forms of exploitation: being paid below minimum wage, unpaid trial shifts, unlawful deductions, sham contracting, cash-in-hand with no super.",
      "Trial shifts: a 'working trial' of more than one hour is illegal without pay. Report extended unpaid trials immediately.",
      "Your employer cannot threaten to report your visa status in response to a pay dispute — this is illegal coercion and a serious criminal offence.",
      "The FWO (Fair Work Ombudsman) has a Migrant Worker Unit specifically for this — they work with interpreters and do not contact immigration without your consent.",
      "If you've been underpaid, you can recover back pay for up to 6 years. Keep payslips, bank statements, and any work records.",
      "Free legal help: Migrant Workers Centre, Community Legal Centres in each state, and Legal Aid all assist with wage theft cases.",
    ],
    link: { label: "Report underpayment anonymously — Fair Work", url: "https://www.fairwork.gov.au/about-us/contact-us/online-enquiries-and-complaints" },
    tip: "Document everything: keep rosters, payslips, bank records, and any messages from your employer. This evidence is crucial for any underpayment claim.",
  },
  {
    id: "safety",
    Icon: ShieldCheckIcon,
    title: "Workplace Health and Safety",
    summary: "Every worker has the right to a safe workplace. This is enforceable by law.",
    steps: [
      "Your employer must provide a safe working environment — this includes appropriate equipment, training, and protective gear at no cost to you.",
      "You have the right to refuse unsafe work without being penalised — document your refusal in writing.",
      "Workplace injuries must be reported to your employer immediately — delays can affect your workers' compensation claim.",
      "Workers' compensation covers medical costs and lost wages for work-related injuries — all employers must have this insurance.",
      "If injured, see a doctor immediately and get a certificate of capacity — this is required for your workers' comp claim.",
      "Safe Work Australia and state WHS regulators (WorkSafe Victoria, SafeWork NSW, etc.) investigate serious safety breaches.",
    ],
    link: { label: "Workers' rights & safety — Safe Work Australia", url: "https://www.safeworkaustralia.gov.au/workers" },
    tip: "If you're asked to work in unsafe conditions, you can call Safe Work Australia's advisory line — they offer confidential guidance and don't immediately trigger an inspection.",
  },
  {
    id: "super-rights",
    Icon: BriefcaseIcon,
    title: "Superannuation Entitlements",
    summary: "Super is part of your wages — your employer stealing super is a criminal offence.",
    steps: [
      "Your employer must pay 11.5% (2024–25) of your ordinary time earnings to your super fund — this is not optional.",
      "Super is due at least quarterly. If your employer is late paying, you're entitled to super guarantee charge (SGC) plus interest.",
      "Check your super contributions in myGov — go to ATO > Super to see all payments to your fund.",
      "If your employer hasn't been paying super, report it to the ATO — the ATO pursues super non-payment aggressively.",
      "Even if you're on a temporary visa and will leave Australia, you can claim your super back via DASP (Departing Australia Superannuation Payment).",
      "Super theft is a growing issue in hospitality and retail — common industries for Nepali workers. Check regularly.",
    ],
    link: { label: "Check super payments via myGov — ATO", url: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/check-your-super-account" },
    tip: "Set a calendar reminder every quarter to log into myGov and verify your super contributions — catching non-payment early is much easier than chasing months of unpaid super.",
  },
  {
    id: "dismissal",
    Icon: MegaphoneIcon,
    title: "Unfair Dismissal and Grievances",
    summary: "Australia has strong protections against unfair dismissal — act quickly if you're terminated unjustly.",
    steps: [
      "Unfair dismissal: if you've been employed for 6+ months (1 year for small businesses), you have the right to challenge a dismissal you believe was harsh, unjust, or unreasonable.",
      "You must file your unfair dismissal application within 21 days of termination — this deadline is strict.",
      "Applications are made to the Fair Work Commission online at fwc.gov.au. The fee is $79.90 and refunded if you win.",
      "General protections (adverse action): your employer cannot dismiss you for exercising a workplace right — e.g. making a complaint, taking sick leave, or joining a union.",
      "Redundancy: if your position is made redundant, you may be entitled to redundancy pay — calculated on years of service.",
      "HR complaints: start with your employer's internal grievance process, document everything, then escalate to Fair Work if unresolved.",
    ],
    link: { label: "Apply for unfair dismissal — Fair Work Commission", url: "https://www.fwc.gov.au/termination-employment/unfair-dismissal" },
    tip: "Get advice before you resign under pressure — resigning may forfeit your unfair dismissal rights. Consult a union or employment lawyer first.",
  },
];

export default function WorkRightsPage() {
  usePageMeta(
    "Work Rights & Legal Guide for Nepalis in Australia",
    "Complete guide to visa work conditions, minimum wage, Fair Work rights, underpayment, workplace safety, superannuation, and unfair dismissal for Nepali migrants in Australia."
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

  const accent = "#6D28D9";
  const accentLight = "#EDE9FE";
  const accentBorder = "#C4B5FD";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)", padding: "56px 24px 48px", textAlign: "center", color: "#fff" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
          <ScalesIcon size={40} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />
          <ShieldCheckIcon size={40} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />
        </div>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          Work Rights &amp; Legal in Australia
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", opacity: 0.9, maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Visa work conditions, minimum wage, Fair Work rights, underpayment and exploitation — know your rights as a Nepali worker in Australia.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://www.fairwork.gov.au" target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            Fair Work Ombudsman
          </a>
          <Link to="/forum" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            Ask the Community
          </Link>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: "56px", zIndex: 90 }}>
        <style>{`.work-nav::-webkit-scrollbar{display:none}`}</style>
        <div ref={navRef} className="work-nav" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px 2px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} data-id={s.id} onClick={() => scrollToSection(s.id)} style={{ background: "none", border: "none", boxShadow: isActive ? `inset 0 -2px 0 0 ${accent}` : "none", padding: "13px 12px", fontSize: "12px", fontWeight: 600, color: isActive ? accent : "#64748b", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s, border-color 0.15s", display: "flex", alignItems: "center", gap: "5px" }}>
                {s.Icon && <s.Icon size={15} weight="duotone" color={isActive ? accent : "#64748b"} />} {s.title.split(" ")[0]}
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
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{s.Icon && <s.Icon size={28} weight="duotone" color={accent} />}</span>
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
                        <LightbulbIcon size={18} weight="fill" color={accent} style={{ flexShrink: 0, marginTop: "1px" }} />
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
        <div style={{ marginTop: "40px", background: "linear-gradient(135deg, #4C1D95, #6D28D9)", borderRadius: "16px", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <HandshakeIcon size={40} weight="duotone" color="#fff" style={{ marginBottom: "12px", opacity: 0.85 }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Work rights question for the community?</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>Nepali lawyers, migration agents, and HR professionals in Australia are active on the NepSaathi forum — get advice from the community.</p>
          <Link to="/forum" style={{ display: "inline-block", background: "#fff", color: accent, borderRadius: "8px", padding: "12px 24px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Ask on the Forum</Link>
        </div>
      </div>
    </div>
  );
}
