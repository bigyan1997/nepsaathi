import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import {
  BuildingsIcon,
  BooksIcon,
  CurrencyDollarIcon,
  UsersThreeIcon,
  HospitalIcon,
  BackpackIcon,
  HandshakeIcon,
  LightbulbIcon,
} from "@phosphor-icons/react";

const sections = [
  {
    id: "childcare",
    Icon: BuildingsIcon,
    title: "Childcare and Early Learning",
    summary: "Australia's childcare system combines care with early education — starting from 6 weeks old.",
    steps: [
      "Types of care: long day care centres (0–5 years), family day care (home-based), out-of-school hours care (before/after school, vacation care).",
      "Childcare quality is rated by ACECQA (Australian Children's Education and Care Quality Authority) on a scale: Excellent, Meeting NQS, Working Towards NQS.",
      "Wait lists for popular childcare centres can be very long (6–24 months) — register when pregnant or as soon as you plan to use care.",
      "To find centres: use the Starting Blocks website (startingblocks.gov.au) to search by suburb, age, and care type.",
      "Most centres are privately run — fees vary significantly. Average long day care cost is around $120–$180 per day before the government subsidy.",
      "Preschool/kindy in the year before school is often offered by long day care centres and standalone kindergartens. Many states offer free or low-cost preschool.",
    ],
    link: { label: "Find childcare near you — Starting Blocks", url: "https://www.startingblocks.gov.au/find-child-care/" },
    tip: "Join multiple waiting lists simultaneously — you can decline offers later. Getting on the list early is the only way to secure a spot at your preferred centre.",
  },
  {
    id: "school",
    Icon: BooksIcon,
    title: "Enrolling Your Child in School",
    summary: "School enrolment is by residential zone — your address determines which public school your child attends.",
    steps: [
      "School starts between ages 4.5 and 6 depending on the state. Check your state's specific starting age requirements.",
      "Public schools are free (except for some activity fees). To enrol, contact your local public school — you'll need a birth certificate, immunisation records, and proof of address.",
      "International students on student visas must pay full school fees at public schools (around $5,000–$14,000/year depending on state) — unless a reciprocal arrangement applies.",
      "Children of 482 (TSS) visa holders generally attend public school for free — check your visa conditions and state government policy.",
      "Permanent residents and citizens: enrol at the local public school for free. You can also apply to a selective school or private school.",
      "Intensive English language programs are available at public schools for students with limited English — ask the school about ESL/EAL support.",
    ],
    link: { label: "School enrolment guide by state — Education.gov.au", url: "https://www.education.gov.au/australian-education-system/school-education" },
    tip: "If your child has limited English, ask the school about EALD (English as an Additional Language or Dialect) support — most public schools have dedicated ESL programs and it's free.",
  },
  {
    id: "ccs",
    Icon: CurrencyDollarIcon,
    title: "Child Care Subsidy (CCS)",
    summary: "The government pays most of your childcare fees directly to the provider — you only pay the gap.",
    steps: [
      "CCS (Child Care Subsidy) is the main government help with childcare costs. It's means-tested — the less you earn, the higher the subsidy.",
      "Eligibility: at least one parent must work, study, or be actively looking for work to qualify. Minimum 1 hour of work/activity per fortnight.",
      "CCS subsidises up to 90%+ of childcare fees for lower-income families. The maximum rate is 90% for families earning under $80,000.",
      "Apply through myGov — link your Centrelink account and complete the CCS application. Payments go directly to your childcare provider.",
      "Your child must be immunised (or have an approved exemption) and meet residency requirements for CCS.",
      "Higher Activity Test: the more hours you work/study, the more subsidised hours you receive (up to 100 hours per fortnight).",
    ],
    link: { label: "Apply for CCS — Services Australia", url: "https://www.servicesaustralia.gov.au/child-care-subsidy" },
    tip: "Apply for CCS before your child's first day — it takes 2–3 weeks to process and back-payments can be difficult to arrange. Apply as soon as you book your spot.",
  },
  {
    id: "ftb",
    Icon: UsersThreeIcon,
    title: "Family Tax Benefit (FTB)",
    summary: "Family Tax Benefit is a fortnightly payment to help with the cost of raising children.",
    steps: [
      "FTB Part A: paid per child, based on family income. For families earning under $60,000, it's the full rate: around $220 per fortnight per child (under 12).",
      "FTB Part B: paid per family (not per child), especially for single income families or one parent who earns very little. Up to $194.60 per fortnight.",
      "Eligibility for both parts requires: child in your care, meeting income thresholds, child meeting immunisation requirements, and meeting residency requirements.",
      "Apply through myGov (Centrelink). You can also receive a lump sum at end of financial year if you prefer.",
      "Temporary visa holders are generally NOT eligible for FTB — it requires PR, citizenship, or specific humanitarian/protected visas.",
      "If your income changes, notify Centrelink immediately — overpayments must be repaid.",
    ],
    link: { label: "Family Tax Benefit — Services Australia", url: "https://www.servicesaustralia.gov.au/family-tax-benefit" },
    tip: "Even if you think you earn too much, apply and check — the income thresholds are higher than many expect, and the cut-off phases in gradually rather than stopping abruptly.",
  },
  {
    id: "child-health",
    Icon: HospitalIcon,
    title: "Child Health Checks",
    summary: "Australia has a comprehensive child health system — free health checks for children from birth.",
    steps: [
      "Maternal and child health services: provided free by local councils from birth. Includes regular weight and developmental checks for babies and toddlers.",
      "Immunisation schedule: Australia has a comprehensive free immunisation schedule from birth to 4 years, and teen boosters. Required for CCS and FTB.",
      "The Australian Immunisation Register (AIR) tracks all vaccinations — get your child's history from myGov or your GP.",
      "Healthy Kids Check: a free health check for 4-year-olds before starting school, through your GP (bulk billed by Medicare).",
      "School dental program: most states have free dental checks for school-age children — ask your school or council about the program in your area.",
      "If you're concerned about your child's development: ask your GP or MCH nurse for a referral to a paediatrician (Medicare subsidised).",
    ],
    link: { label: "Child health and development — Raising Children Network", url: "https://raisingchildren.net.au/health" },
    tip: "The Raising Children Network (raisingchildren.net.au) is the Australian government's parenting resource — it's available in multiple languages including Nepali.",
  },
  {
    id: "holiday-programs",
    Icon: BackpackIcon,
    title: "School Holiday Programs",
    summary: "School holidays run 12 weeks per year — planned care is essential for working parents.",
    steps: [
      "Australia has four school terms with holidays in between: 6 weeks in summer (Dec–Jan), 2 weeks in April, 2 weeks in July, 2 weeks in September/October.",
      "Outside School Hours Care (OSHC) provides before school, after school, and vacation care — offered at or near most primary schools.",
      "CCS applies to OSHC vacation care as well as regular before/after school care — reducing costs significantly.",
      "Many councils, libraries, and community centres run free or low-cost holiday programs — check your local council website.",
      "Nepali community groups often organise holiday activities for children — cultural events, language classes, sports.",
      "Work with your employer ahead of time on flexibility during school holidays — especially for parents without family support networks in Australia.",
    ],
    link: { label: "Find out-of-school-hours care — Starting Blocks", url: "https://www.startingblocks.gov.au/child-care-and-early-learning/types-of-child-care/outside-school-hours-care/" },
    tip: "Book vacation care spots well in advance — popular OSHC programs fill up within days of booking opening, especially for summer holidays.",
  },
  {
    id: "family-support",
    Icon: HandshakeIcon,
    title: "Family Support Services",
    summary: "Australia has extensive support services for families — you don't need to navigate it alone.",
    steps: [
      "Parenting Line: call 1300 30 1300 for free parenting support and advice — available in most states.",
      "Family support services: offered through state governments, Headspace for teens, and community organisations.",
      "Domestic violence support: 1800RESPECT (1800 737 732) — confidential 24/7 support for domestic and family violence.",
      "Nepali community organisations in each major city: they run family support programs, cultural events, and can connect you with services in Nepali language.",
      "Settlement services for newly arrived migrants: AMES Australia, CatholicCare, Multicultural NSW, Settlement Services International — all offer free family support.",
      "Interpreter services: the Translating and Interpreting Service (TIS National) is free for interactions with most government services — call 131 450.",
    ],
    link: { label: "Family support services — Family Lives", url: "https://www.dss.gov.au/families-and-children" },
    tip: "The TIS (Translating and Interpreting Service) at 131 450 is free and available 24/7 for Nepali speakers — use it for any official appointment where language is a barrier.",
  },
];

export default function ChildcarePage() {
  usePageMeta(
    "Childcare & Family Guide for Nepalis in Australia",
    "Complete guide to childcare, school enrolment, Child Care Subsidy, Family Tax Benefit, child health, and family support services for Nepali families in Australia."
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

  const accent = "#BE185D";
  const accentLight = "#FCE7F3";
  const accentBorder = "#F9A8D4";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg, #9D174D 0%, #BE185D 60%, #DB2777 100%)", padding: "56px 24px 48px", textAlign: "center", color: "#fff" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
          <UsersThreeIcon size={40} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />
          <BuildingsIcon size={40} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />
        </div>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          Childcare &amp; Family in Australia
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", opacity: 0.9, maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Childcare, school enrolment, Child Care Subsidy, Family Tax Benefit, and family support services — everything Nepali families need to know in Australia.
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
        <style>{`.childcare-nav::-webkit-scrollbar{display:none}`}</style>
        <div ref={navRef} className="childcare-nav" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px 2px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
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
        <div style={{ marginTop: "40px", background: "linear-gradient(135deg, #9D174D, #BE185D)", borderRadius: "16px", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <HandshakeIcon size={40} weight="duotone" color="#fff" style={{ marginBottom: "12px", opacity: 0.85 }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Family question for the community?</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>Connect with Nepali parents, childcare workers, and teachers in Australia on the NepSaathi forum.</p>
          <Link to="/forum" style={{ display: "inline-block", background: "#fff", color: accent, borderRadius: "8px", padding: "12px 24px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Ask on the Forum</Link>
        </div>
      </div>
    </div>
  );
}
