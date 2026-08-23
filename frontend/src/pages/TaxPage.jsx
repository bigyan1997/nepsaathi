import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import {
  IdentificationCardIcon,
  ClipboardTextIcon,
  BriefcaseIcon,
  CalculatorIcon,
  FileTextIcon,
  CurrencyDollarIcon,
  UserIcon,
  LightbulbIcon,
  HandshakeIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";

const sections = [
  {
    id: "tfn",
    Icon: IdentificationCardIcon,
    title: "Tax File Number (TFN)",
    summary: "Your TFN is your unique identifier with the Australian Tax Office — apply as soon as you arrive.",
    steps: [
      "A Tax File Number (TFN) is a 9-digit number the ATO uses to track your tax affairs. Every worker in Australia should have one.",
      "Apply online at ato.gov.au/tfn — takes about 10 minutes. You'll need your passport and visa details.",
      "Your TFN arrives by post to your Australian address in 10–28 days.",
      "Give your TFN to your employer on your first day — without it, you're taxed at the top rate (47%).",
      "Also give your TFN to your bank and super fund to avoid penalty tax rates on interest and contributions.",
      "Your TFN is yours for life. Keep it secret — sharing it unnecessarily risks identity theft.",
    ],
    link: { label: "Apply for a TFN — ATO", url: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" },
    tip: "Never pay anyone to get a TFN — it's free and takes 10 minutes online. If someone offers to 'arrange' it for a fee, it's a scam.",
  },
  {
    id: "tax-return",
    Icon: ClipboardTextIcon,
    title: "Lodging Your Tax Return",
    summary: "The Australian financial year runs July 1 to June 30. Your return is due by October 31.",
    steps: [
      "The Australian financial year is 1 July to 30 June. Your tax return covers income in that period.",
      "Lodge your return online via myTax on myGov (ato.gov.au/mygov) — usually free and auto-filled from employer and bank data.",
      "The deadline is 31 October for self-lodgers. Using a registered tax agent gives you an extension (usually to May the following year).",
      "You'll need your group certificate (now called Income Statement) — your employer submits this to the ATO by 14 July.",
      "If you left Australia mid-year or were only here part of the year, you still need to lodge for the Australian-source income you earned.",
      "Most people get a refund — the average Australian tax refund is around $2,800.",
    ],
    link: { label: "Lodge via myTax — ATO", url: "https://www.ato.gov.au/individuals-and-families/lodging-your-tax-return/lodge-online-with-mytax" },
    tip: "Link your myGov account to the ATO before 30 June — this pre-fills your return with employer, bank, and super data, making it much faster to lodge.",
  },
  {
    id: "deductions",
    Icon: BriefcaseIcon,
    title: "Tax Deductions You Can Claim",
    summary: "Every legitimate deduction reduces your taxable income and increases your refund.",
    steps: [
      "Work-related expenses you can claim: work uniforms (if required), protective equipment, tools, professional subscriptions, union fees.",
      "Home office: if you work from home, you can claim a portion of electricity, internet, and phone costs.",
      "Self-education: if your course directly relates to your current job (not a new career), you can claim tuition and textbooks.",
      "Vehicle: if you use your own car for work (not commuting), you can claim 88 cents per kilometre (2024–25 rate).",
      "Charitable donations: donations of $2 or more to DGR (Deductible Gift Recipient) charities are deductible.",
      "Keep all receipts and records for 5 years — the ATO can audit any return in that period.",
    ],
    link: { label: "Deductions guide — ATO", url: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim" },
    tip: "You cannot claim the cost of commuting to and from work. 'Work-related' means while at work or between work sites, not travelling to work.",
  },
  {
    id: "payslip",
    Icon: CalculatorIcon,
    title: "Understanding Your Payslip (PAYG)",
    summary: "PAYG withholding means your employer deducts tax from every pay — you reconcile at tax time.",
    steps: [
      "PAYG (Pay As You Go) withholding means your employer deducts estimated tax from each pay and sends it to the ATO.",
      "Your payslip should show: gross pay, tax withheld, super contribution (your employer's payment to your fund), and net pay.",
      "The tax withheld is based on your annual projected income. If your income varies, you may get a refund or owe more.",
      "Check your payslip every pay cycle: ensure your super is being paid and your tax rate looks correct for your income level.",
      "2024–25 tax rates: 0% on first $18,200 (tax-free threshold), 16% on $18,201–$45,000, 30% on $45,001–$135,000.",
      "Claim the tax-free threshold at only one employer — if you have two jobs, only claim it at the higher-paying one.",
    ],
    link: { label: "Income tax rates — ATO", url: "https://www.ato.gov.au/rates/individual-income-tax-rates/" },
    tip: "Use the ATO's income tax calculator (ato.gov.au/calculators) to estimate your tax before lodging — it'll tell you if you'll get a refund or owe money.",
  },
  {
    id: "abn",
    Icon: FileTextIcon,
    title: "ABN — Do You Need One?",
    summary: "An ABN is for businesses and the self-employed. You need one if you're contracting or running a business.",
    steps: [
      "ABN (Australian Business Number) is an 11-digit number for businesses and sole traders. It's free to apply at abr.gov.au.",
      "You need an ABN if you're running your own business, providing services as a contractor/freelancer, or driving for Uber/DiDi.",
      "Without an ABN, anyone paying you for business services must withhold 47% tax from your payment (top marginal rate).",
      "Registering for GST (Goods and Services Tax) is required if your business turnover is $75,000+ per year. If under $75,000, it's optional.",
      "ABN does NOT replace TFN — you use both. TFN is for personal income tax; ABN is for business tax obligations.",
      "Sole traders report business income on their personal tax return — there's no separate business tax return unless you operate as a company.",
    ],
    link: { label: "Apply for an ABN — ABR", url: "https://www.abr.gov.au/business-super-funds-charities/applying-for-an-abn" },
    tip: "Don't register an ABN unless you're genuinely carrying on a business — the ATO cancels ABNs registered just to avoid tax withholding. Penalties apply.",
  },
  {
    id: "gst",
    Icon: CurrencyDollarIcon,
    title: "GST and Business Tax",
    summary: "GST (Goods and Services Tax) is 10% on most goods and services sold in Australia.",
    steps: [
      "GST is 10% on most sales. If registered, you add GST to your prices, collect it from customers, and send it to the ATO.",
      "GST registered businesses can claim back the GST they pay on business purchases (input tax credits).",
      "Lodge a BAS (Business Activity Statement) quarterly or monthly to report and pay GST — available through myGov or your tax agent.",
      "Fringe benefits tax (FBT) applies if you provide non-cash benefits to employees (e.g. company car). Separate to income tax.",
      "Payroll tax is a state/territory tax on wages you pay employees — varies by state and threshold. Not paid to the ATO.",
      "Company tax rate is 25% for base rate entities (turnover under $50M) and 30% for larger companies.",
    ],
    link: { label: "GST explained — ATO", url: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst" },
    tip: "Keep business and personal expenses completely separate — use a dedicated business bank account and card from day one.",
  },
  {
    id: "tax-agent",
    Icon: UserIcon,
    title: "Finding a Tax Agent",
    summary: "A registered tax agent handles your return, extends your deadline, and finds deductions you'd miss.",
    steps: [
      "Registered tax agents are licensed by the Tax Practitioners Board (TPB). Check the register at tpb.gov.au before engaging anyone.",
      "A tax agent's fee is itself tax deductible the following year — so their cost is partly offset.",
      "Using a registered tax agent gives you until May 15 the following year to lodge (instead of October 31).",
      "Accountants in the Nepali community often advertise in NepSaathi listings and the forum — searching 'Nepali accountant Sydney/Melbourne' gets results.",
      "Average cost for a simple individual tax return: $100–$250. Complex returns (investment property, multiple income sources) cost more.",
      "H&R Block, Etax.com.au, and Tax Return Sydney are online options for simpler returns at lower cost.",
    ],
    link: { label: "Find a registered tax agent — TPB", url: "https://www.tpb.gov.au/tax-agent-services/find-a-tax-practitioner" },
    tip: "Never use an unregistered person to lodge your return — if they make mistakes, you're liable for the tax debt and penalties, not them.",
  },
];

export default function TaxPage() {
  usePageMeta(
    "Tax & Accounting Guide for Nepalis in Australia",
    "Complete guide to TFN, tax returns, deductions, PAYG, ABN, GST and finding a tax agent for Nepali migrants in Australia."
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

  const accent = "#B45309";
  const accentLight = "#FEF3C7";
  const accentBorder = "#FCD34D";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg, #92400E 0%, #B45309 60%, #D97706 100%)", padding: "56px 24px 48px", textAlign: "center", color: "#fff" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
          <ReceiptIcon size={40} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />
          <ClipboardTextIcon size={40} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />
        </div>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          Tax &amp; Accounting in Australia
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", opacity: 0.9, maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          TFN, tax returns, deductions, PAYG, ABN and GST — everything Nepali migrants need to know about Australian tax obligations.
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
        <style>{`.tax-nav::-webkit-scrollbar{display:none}`}</style>
        <div ref={navRef} className="tax-nav" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px 2px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
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
        <div style={{ marginTop: "40px", background: "linear-gradient(135deg, #92400E, #B45309)", borderRadius: "16px", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <HandshakeIcon size={40} weight="duotone" color="#fff" style={{ marginBottom: "12px", opacity: 0.85 }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Tax question for the community?</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>Nepali accountants and tax agents in Australia are active on the NepSaathi forum — get free advice from the community.</p>
          <Link to="/forum" style={{ display: "inline-block", background: "#fff", color: accent, borderRadius: "8px", padding: "12px 24px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Ask on the Forum</Link>
        </div>
      </div>
    </div>
  );
}
