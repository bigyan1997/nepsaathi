import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

const sections = [
  {
    id: "first-account",
    icon: "🏦",
    title: "Setting Up Your First Bank Account",
    summary: "Open an Australian bank account before you even land — most major banks allow it.",
    steps: [
      "Commonwealth Bank, ANZ, NAB and Westpac all allow overseas applicants to open an account online before arriving in Australia.",
      "You'll need your passport, visa grant letter, and an Australian address (your university or a friend's address works for initial setup).",
      "Activate the account at any branch within 6 months of arrival by showing your passport and visa.",
      "Student-friendly accounts with no monthly fees: CommBank Smart Access, ANZ Access Advantage, NAB Classic Banking.",
      "For new arrivals without a credit history, a basic debit card account is the quickest way to start — build credit history over time.",
      "Set up internet banking immediately — almost every employer in Australia pays by direct deposit (EFT).",
    ],
    link: { label: "Compare money transfer rates to Nepal", url: "/send-money" },
    tip: "Don't carry large amounts of cash after arrival. Get your debit card activated as your very first errand.",
  },
  {
    id: "super",
    icon: "💰",
    title: "Superannuation (Super)",
    summary: "Your employer must pay super on top of your salary — it's your retirement savings and you own it.",
    steps: [
      "Employers must contribute 11.5% (rising to 12% in July 2025) of your ordinary time earnings to a super fund — on top of your salary, not out of it.",
      "You can choose your own super fund. If you don't choose, your employer picks one (a 'default fund').",
      "Popular funds: Australian Super, Hostplus, REST, Aware Super — compare fees and insurance at moneysmart.gov.au.",
      "If you leave Australia permanently and your visa has expired, you can claim your super back as a Departing Australia Superannuation Payment (DASP).",
      "Tax on DASP is 35% for temporary residents — still worth claiming, as you can't access it otherwise.",
      "Use myGov to see all your super accounts. Many people accidentally have multiple accounts with fees eating into each.",
    ],
    link: { label: "Compare super funds — MoneySmart", url: "https://www.moneysmart.gov.au/superannuation-and-retirement/how-super-works/choosing-a-super-fund" },
    tip: "Always give your employer your super fund details and TFN on day one. Without your TFN, super is taxed at 47% (the 'no-TFN tax').",
  },
  {
    id: "credit",
    icon: "💳",
    title: "Credit Cards and Personal Loans",
    summary: "Building a credit history in Australia takes time — start early and carefully.",
    steps: [
      "Australia has its own credit reporting system. Your credit history from Nepal does not transfer.",
      "To build credit: open a bank account, get a debit card, pay all bills on time, and after 6–12 months apply for a low-limit credit card.",
      "Good starter credit cards: ANZ First Visa, CommBank Low Rate Card — both designed for people with limited credit history.",
      "Never miss a repayment — even one late payment can affect your credit score for years.",
      "Check your credit score free at Equifax, Experian, or illion (all have free annual checks).",
      "Be wary of Buy Now Pay Later (BNPL) services like Afterpay — they don't build credit but missed payments harm it.",
    ],
    link: { label: "Check your credit score free — MoneySmart", url: "https://www.moneysmart.gov.au/borrowing-and-credit/credit-scores-and-credit-reports" },
    tip: "Don't apply for multiple credit cards at once — each application shows on your credit file and too many applications lower your score.",
  },
  {
    id: "home-loan",
    icon: "🏠",
    title: "Home Loans for Migrants",
    summary: "Buying property in Australia as a migrant or temporary resident has specific rules.",
    steps: [
      "Temporary visa holders (e.g. student, 482) generally cannot buy established dwellings — you need FIRB (Foreign Investment Review Board) approval to buy new property only.",
      "Permanent residents and citizens can buy any property without FIRB approval.",
      "Most lenders require a minimum 20% deposit for non-citizens/non-PR holders. With less than 20%, you pay Lender's Mortgage Insurance (LMI).",
      "First Home Owner Grant (FHOG): available to PR holders and citizens buying a new home — amount varies by state (e.g. $10,000 in NSW, $30,000 in QLD).",
      "Stamp duty concessions for first home buyers also vary by state — check your state revenue office.",
      "Use a mortgage broker — they compare hundreds of lenders and their service is free (paid by the lender).",
    ],
    link: { label: "FIRB rules for foreign buyers", url: "https://firb.gov.au/residential-land/temporary-residents" },
    tip: "Don't buy before getting PR if you're on a temporary visa — the FIRB rules and higher deposit requirements make it significantly more expensive.",
  },
  {
    id: "investing",
    icon: "📈",
    title: "Investing in Australia",
    summary: "Once you have stable income, investing is worth exploring — even small amounts compound significantly.",
    steps: [
      "Shares (stocks): you can invest in Australian or international shares through brokers like CommSec, SelfWealth, or Stake. Minimum amounts as low as $50.",
      "ETFs (Exchange Traded Funds) are a low-cost way to invest in hundreds of companies at once — Vanguard and iShares are popular in Australia.",
      "Investment income (dividends, capital gains) must be declared on your tax return — keep records of every transaction.",
      "Property investment: common among the Nepali community. Rental income is taxable but many expenses are deductible (interest, rates, depreciation).",
      "If you invest while on a temporary visa, be aware that capital gains tax rules differ for non-residents — get advice before selling.",
      "Super is already an investment — contribute extra (salary sacrifice) to boost tax-advantaged retirement savings.",
    ],
    link: { label: "Investing basics — MoneySmart", url: "https://www.moneysmart.gov.au/investing" },
    tip: "Get financial advice from a licensed financial adviser (check ASIC's register at moneysmart.gov.au) before making large investment decisions.",
  },
  {
    id: "remittance",
    icon: "💸",
    title: "Sending Money to Nepal",
    summary: "Your bank's international transfer rate is almost never the best — use a specialist service.",
    steps: [
      "Bank wire transfers (SWIFT) typically charge $20–30 fee plus a poor exchange rate — costing you hundreds of dollars per year.",
      "Better alternatives: Wise (formerly TransferWise), Remitly, Western Union, IME Pay, Prabhu Money — all offer significantly better rates.",
      "Wise is best for transparency — it shows the real mid-market rate and exact fees before you send.",
      "IME Pay and Prabhu Money are popular in the Nepali community for direct bank-to-bank transfers in Nepal.",
      "Compare rates before every transfer — rates change daily and the gap between providers can be significant.",
      "For large amounts (AUD 10,000+), consider timing your transfer when AUD is strong against NPR.",
    ],
    link: { label: "Compare live remittance rates", url: "/send-money" },
    tip: "Set up a rate alert on Wise or Remitly — they'll notify you when the AUD/NPR rate hits your target, so you don't have to watch it daily.",
  },
  {
    id: "tfn-banking",
    icon: "🧾",
    title: "Tax File Number and Banking",
    summary: "Your TFN connects your bank accounts and investments to the ATO for tax purposes.",
    steps: [
      "Provide your TFN to your bank when you open an account — without it, any interest earned is taxed at 47%.",
      "Provide your TFN to your super fund — without it, contributions are taxed at 47% instead of 15%.",
      "You are not legally required to give your TFN to a bank or super fund, but the tax penalty for not doing so is severe.",
      "Never give your TFN to anyone asking for it unexpectedly — it is a major target for identity theft.",
      "The ATO uses your TFN to pre-fill much of your tax return — making lodgement much easier.",
      "Apply for your TFN at ato.gov.au/tfn — it's free and takes 10–28 days to arrive by post.",
    ],
    link: { label: "Apply for a TFN — ATO", url: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" },
    tip: "Your TFN is yours for life — it doesn't change when you change visa status, employer, or become a citizen.",
  },
];

export default function BankingPage() {
  usePageMeta(
    "Banking & Finance Guide for Nepalis in Australia",
    "Complete guide to banking, superannuation, home loans, investing and sending money to Nepal for Nepali migrants in Australia."
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

  const accent = "#1A6B3C";
  const accentLight = "#E8F5EE";
  const accentBorder = "#A7D7BC";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg, #1A6B3C 0%, #15803D 60%, #16A34A 100%)", padding: "56px 24px 48px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🏦💰</div>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          Banking &amp; Finance in Australia
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", opacity: 0.9, maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Bank accounts, superannuation, home loans, investing and sending money home — everything Nepali migrants need to manage money in Australia.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/send-money" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            Compare Remittance Rates
          </Link>
          <Link to="/new-to-australia" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            New to Australia Guide
          </Link>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: "56px", zIndex: 90 }}>
        <style>{`.banking-nav::-webkit-scrollbar{display:none}`}</style>
        <div ref={navRef} className="banking-nav" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} data-id={s.id} onClick={() => scrollToSection(s.id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${isActive ? accent : "transparent"}`, padding: "13px 12px", fontSize: "12px", fontWeight: 600, color: isActive ? accent : "#64748b", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s, border-color 0.15s" }}>
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
        <div style={{ marginTop: "40px", background: "linear-gradient(135deg, #1A6B3C, #15803D)", borderRadius: "16px", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>🤝</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Have a finance question?</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>Ask the NepSaathi community — Nepali accountants, mortgage brokers, and financial advisers are active on the forum.</p>
          <Link to="/forum" style={{ display: "inline-block", background: "#fff", color: accent, borderRadius: "8px", padding: "12px 24px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Ask on the Forum</Link>
        </div>
      </div>
    </div>
  );
}
