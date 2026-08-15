import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import useAuthStore from "../store/authStore";
import { useToast } from "../components/ui/Toast";
import {
  getVisaTimelines,
  getVisaStats,
  submitVisaTimeline,
  updateVisaTimeline,
  getOccupations,
  getInvitationRounds,
} from "../api/visa";

// ─── Official Australian Skilled Migration Points (as of 2025) ───────────────
const POINTS_CONFIG = [
  {
    id: "age",
    label: "Age",
    note: "At time of invitation",
    options: [
      { label: "18–24", value: 25 },
      { label: "25–32", value: 30 },
      { label: "33–39", value: 25 },
      { label: "40–44", value: 15 },
      { label: "45 or older", value: 0 },
    ],
  },
  {
    id: "english",
    label: "English Language",
    note: "IELTS: Proficient = 7.0+ each band; Superior = 8.0+ each band",
    options: [
      { label: "Competent English (IELTS 6.0+ each band)", value: 0 },
      { label: "Proficient English (IELTS 7.0+ each band)", value: 10 },
      { label: "Superior English (IELTS 8.0+ each band)", value: 20 },
    ],
  },
  {
    id: "overseas_work",
    label: "Overseas Skilled Employment",
    note: "Last 10 years, in your nominated occupation",
    options: [
      { label: "Less than 1 year", value: 0 },
      { label: "1–3 years", value: 5 },
      { label: "3–5 years", value: 10 },
      { label: "5–8 years", value: 15 },
      { label: "8 years or more", value: 20 },
    ],
  },
  {
    id: "au_work",
    label: "Australian Skilled Employment",
    note: "In your nominated occupation",
    options: [
      { label: "Less than 1 year", value: 0 },
      { label: "1–3 years", value: 5 },
      { label: "3–5 years", value: 10 },
      { label: "5–8 years", value: 15 },
      { label: "8 years or more", value: 20 },
    ],
  },
  {
    id: "education",
    label: "Educational Qualifications",
    note: "Highest applicable",
    options: [
      { label: "No Australian/recognised overseas qualification", value: 0 },
      { label: "Recognised overseas qualification (bachelor level or above)", value: 15 },
      { label: "Australian bachelor, masters, diploma, or trade qualification", value: 15 },
      { label: "Australian doctorate (PhD)", value: 20 },
    ],
  },
  {
    id: "partner",
    label: "Partner Status",
    note: "Spouse / de facto partner",
    options: [
      { label: "No partner, or partner is Australian citizen / PR", value: 10 },
      { label: "Partner has skills assessment + Proficient English + under 45", value: 10 },
      { label: "Partner has at least Competent English (no skills assessment)", value: 5 },
      { label: "Partner not applicable", value: 0 },
    ],
  },
  {
    id: "professional_year",
    label: "Professional Year in Australia",
    note: "⚠️ Only available for Accounting (CPA/CAANZ/IPA), Engineering (Engineers Australia), and ICT (ACS) graduates. Nurses, teachers, healthcare, and all other fields do NOT qualify.",
    options: [
      { label: "Yes — completed Professional Year (Accounting / Engineering / ICT only)", value: 5 },
      { label: "No / My field is not eligible", value: 0 },
    ],
  },
  {
    id: "naati",
    label: "Credentialled Community Language",
    note: "NAATI accreditation (e.g. Nepali interpreter/translator)",
    options: [
      { label: "Yes — NAATI credentialled", value: 5 },
      { label: "No", value: 0 },
    ],
  },
  {
    id: "regional_study",
    label: "Study in Regional Australia",
    note: "At least 2 academic years of study AND 1 year work in regional Australia",
    options: [
      { label: "Yes — meets regional study & work requirement", value: 5 },
      { label: "No", value: 0 },
    ],
  },
];

const VISA_TYPES = [
  { value: "", label: "All visa types" },
  { value: "485", label: "Temporary Graduate (485)" },
  { value: "189", label: "Skilled Independent (189)" },
  { value: "190", label: "Skilled Nominated (190)" },
  { value: "491", label: "Skilled Work Regional (491)" },
  { value: "500", label: "Student (500)" },
  { value: "482", label: "Employer Sponsored (482)" },
  { value: "820", label: "Partner (820/801)" },
  { value: "other", label: "Other" },
];

const AU_STATES = [
  { value: "", label: "All states" },
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "WA", label: "WA" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "NT" },
];

const RESOURCES = [
  {
    category: "Processing Times",
    icon: "⏱",
    items: [
      {
        title: "Global visa processing times",
        description: "Official DOHA page — current processing times for all visa subclasses",
        url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times/global-visa-processing-times",
      },
    ],
  },
  {
    category: "SkillSelect & Invitations",
    icon: "📊",
    items: [
      {
        title: "SkillSelect invitation rounds",
        description: "Latest EOI invitation rounds — cutoff scores by occupation and visa type",
        url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
      },
      {
        title: "Submit an Expression of Interest (EOI)",
        description: "Lodge your EOI for 189, 190, or 491 visas via SkillSelect",
        url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect",
      },
    ],
  },
  {
    category: "Skills Assessment Bodies",
    icon: "🎓",
    items: [
      {
        title: "Engineers Australia (EA)",
        description: "Skills assessment for engineering occupations",
        url: "https://www.engineersaustralia.org.au/skills-assessment",
      },
      {
        title: "VETASSESS",
        description: "Assessment for a wide range of professional and trade occupations",
        url: "https://www.vetassess.com.au/skills-assessment-for-migration",
      },
      {
        title: "CPA Australia / CAANZ",
        description: "Skills assessment for accountants and finance professionals",
        url: "https://www.cpaaustralia.com.au/",
      },
      {
        title: "AHPRA",
        description: "Registration for healthcare professionals (nurses, doctors, pharmacists)",
        url: "https://www.ahpra.gov.au/",
      },
      {
        title: "ACS (IT professionals)",
        description: "Australian Computer Society — skills assessment for ICT occupations",
        url: "https://www.acs.org.au/msa",
      },
      {
        title: "All assessing authorities",
        description: "Full list of approved skills assessing authorities on DOHA",
        url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment/approved-assessing-authorities",
      },
    ],
  },
  {
    category: "English Language Tests",
    icon: "📝",
    items: [
      {
        title: "IELTS — Academic or General",
        description: "Most common. Competent=6.0 each band, Proficient=7.0, Superior=8.0",
        url: "https://ielts.org/",
      },
      {
        title: "PTE Academic",
        description: "Computer-based. Competent=50+, Proficient=65+, Superior=79+",
        url: "https://www.pearsonpte.com/",
      },
      {
        title: "TOEFL iBT",
        description: "Online test accepted for some visa subclasses",
        url: "https://www.ets.org/toefl",
      },
      {
        title: "Cambridge C1 Advanced (CAE)",
        description: "Also accepted — check DOHA for minimum scores",
        url: "https://www.cambridgeenglish.org/exams-and-tests/advanced/",
      },
    ],
  },
  {
    category: "State & Territory Nomination",
    icon: "🗺",
    items: [
      {
        title: "NSW — skilled migration",
        description: "New South Wales skilled and business migration program",
        url: "https://www.nsw.gov.au/working-in-nsw/skilled-workers/migration",
      },
      {
        title: "VIC — skilled migration",
        description: "Victoria's Live in Melbourne skilled nomination program",
        url: "https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas",
      },
      {
        title: "QLD — skilled migration",
        description: "Queensland skilled migration program",
        url: "https://migration.qld.gov.au/skilled-visas/",
      },
      {
        title: "All state/territory programs",
        description: "Overview of all state and territory nomination programs on DOHA",
        url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/state-territory-nominated",
      },
    ],
  },
  {
    category: "Official Calculators & Tools",
    icon: "🔢",
    items: [
      {
        title: "Official points calculator — DOHA",
        description: "Department of Home Affairs points calculator for skilled migration",
        url: "https://immi.homeaffairs.gov.au/help-support/tools/points-calculator",
      },
      {
        title: "ANZSCO occupation search",
        description: "Find your ANZSCO code and check if your occupation is on the relevant list",
        url: "https://www.abs.gov.au/statistics/classifications/anzsco-australian-and-new-zealand-standard-classification-occupations",
      },
      {
        title: "Medium and Long-term Strategic Skills List (MLTSSL)",
        description: "Occupations eligible for 189, 190, and 491 visas",
        url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list",
      },
    ],
  },
  {
    category: "Migration Agents",
    icon: "👨‍💼",
    items: [
      {
        title: "Find a registered migration agent (MARA)",
        description: "Only use MARA-registered agents — verify their registration before paying",
        url: "https://www.mara.gov.au/",
      },
      {
        title: "NepSaathi business directory — migration agents",
        description: "Nepali-speaking migration agents listed on NepSaathi",
        url: "/businesses?category=migration",
        internal: true,
      },
    ],
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 20px",
        borderRadius: "8px",
        border: "1.5px solid",
        borderColor: active ? "#534AB7" : "transparent",
        background: active ? "#EEEDFE" : "transparent",
        color: active ? "#534AB7" : "#666",
        fontWeight: active ? 700 : 500,
        fontSize: "14px",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );
}

function SelectInput({ value, onChange, options, style }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: "1.5px solid #ddd",
        borderRadius: "9px",
        padding: "9px 12px",
        fontSize: "13px",
        background: "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        color: "#333",
        outline: "none",
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Occupation invite context (used by PRCalculator) ────────────────────────

function OccupationInviteContext({ occupation, score, visaType }) {
  const relevant = occupation.invitations.filter(
    (inv) => !visaType || inv.visa_type === visaType
  );

  if (relevant.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: '#26215C', marginBottom: '4px' }}>
          SkillSelect data — {occupation.title}
        </div>
        <div style={{ fontSize: '12.5px', color: '#888' }}>
          No per-occupation invitation data yet for this occupation.{' '}
          <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7' }}>
            Check DOHA SkillSelect ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px' }}>
      <div style={{ fontWeight: 700, fontSize: '13px', color: '#26215C', marginBottom: '10px' }}>
        SkillSelect history — {occupation.title} ({occupation.anzsco_code})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {relevant.map((inv) => {
          const invited = inv.was_invited;
          const icon = invited ? '✓' : '✗';
          const bg = invited ? '#dcfce7' : '#fee2e2';
          const border = invited ? '#86efac' : '#fca5a5';
          const textColor = invited ? '#15803d' : '#dc2626';

          let scoreMsg = null;
          if (invited && inv.score != null) {
            if (score >= inv.score) {
              scoreMsg = `Your ${score} pts is above the ${inv.score} pt cutoff — good position if invited ✓`;
            } else {
              scoreMsg = `You need ${inv.score - score} more pts to reach the ${inv.score} pt cutoff for this round`;
            }
          } else if (!invited) {
            scoreMsg = `This occupation was not invited even at higher scores — per-occupation ceiling was already filled`;
          }

          return (
            <div key={`${inv.round_date}-${inv.visa_type}`} style={{ display: 'flex', gap: '10px', background: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '10px 14px' }}>
              <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: textColor }}>
                  {invited ? 'Invited' : 'Not invited'} in {inv.round_date}
                  {' '}
                  <span style={{ background: VISA_COLORS[inv.visa_type] || '#534AB7', color: '#fff', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', fontWeight: 700 }}>
                    {inv.visa_type}
                  </span>
                  {invited && inv.score != null && (
                    <span style={{ fontWeight: 400, color: '#166534' }}> — {inv.score} pts cutoff</span>
                  )}
                </div>
                {scoreMsg && (
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>{scoreMsg}</div>
                )}
                {inv.notes && (
                  <div style={{ fontSize: '11.5px', color: '#888', marginTop: '2px' }}>{inv.notes}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 1: PR Calculator ────────────────────────────────────────────────────

function PRCalculator() {
  const [selections, setSelections] = useState({});
  const [visaType, setVisaType] = useState("189");
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  const { data: occupations = [] } = useQuery({
    queryKey: ['occupations'],
    queryFn: () => getOccupations(),
    staleTime: 1000 * 60 * 30,
  });

  const total = Object.values(selections).reduce((s, v) => s + v, 0);
  const bonusPoints = visaType === "190" ? 5 : visaType === "491" ? 15 : 0;
  const finalTotal = total + bonusPoints;

  const thresholds = [65, 70, 75, 80, 85, 90, 95];
  const nextThreshold = thresholds.find((t) => t > finalTotal);
  const gap = nextThreshold ? nextThreshold - finalTotal : 0;

  const getScoreColor = (score) => {
    if (score >= 90) return "#16a34a";
    if (score >= 75) return "#534AB7";
    if (score >= 65) return "#E87722";
    return "#888";
  };

  return (
    <div>
      <div style={{ background: "#EEEDFE", borderRadius: "14px", padding: "20px 24px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#534AB7", marginBottom: "4px" }}>Your total score</div>
          <div style={{ fontSize: "52px", fontWeight: 800, color: getScoreColor(finalTotal), lineHeight: 1 }}>{finalTotal}</div>
          <div style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>
            {finalTotal >= 65 ? "✅ Meets minimum threshold (65 pts)" : `❌ Need ${65 - finalTotal} more pts to reach minimum (65)`}
          </div>
          {nextThreshold && finalTotal >= 65 && (
            <div style={{ fontSize: "13px", color: "#534AB7", marginTop: "4px" }}>
              📈 {gap} more pts to reach {nextThreshold}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#666" }}>Calculating for visa:</div>
          <SelectInput
            value={visaType}
            onChange={setVisaType}
            options={[
              { value: "189", label: "189 — Skilled Independent" },
              { value: "190", label: "190 — Skilled Nominated (+5 pts)" },
              { value: "491", label: "491 — Skilled Regional (+15 pts)" },
            ]}
          />
          {bonusPoints > 0 && (
            <div style={{ fontSize: "12px", color: "#1B8F5E", fontWeight: 600 }}>
              ✓ {bonusPoints} nomination bonus included
            </div>
          )}
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#666", marginTop: "8px" }}>Your occupation (optional):</div>
          <select
            value={selectedOccupation?.id || ''}
            onChange={(e) => {
              const occ = occupations.find((o) => String(o.id) === e.target.value);
              setSelectedOccupation(occ || null);
            }}
            style={{ border: "1.5px solid #c4b5fd", borderRadius: "9px", padding: "8px 10px", fontSize: "12px", background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#333", outline: "none" }}
          >
            <option value="">— Select to see invite data —</option>
            {[...occupations].sort((a, b) => a.title.localeCompare(b.title)).map((o) => (
              <option key={o.id} value={String(o.id)}>{o.title}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedOccupation && (
        <OccupationInviteContext
          occupation={selectedOccupation}
          score={finalTotal}
          visaType={visaType}
        />
      )}

      <div style={{ background: "#fffbe6", border: "1px solid #fcd34d", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#92400e" }}>
        <strong>Note:</strong> This calculator uses the official points table as of 2025. Always verify with the{" "}
        <a href="https://immi.homeaffairs.gov.au/help-support/tools/points-calculator" target="_blank" rel="noopener noreferrer" style={{ color: "#534AB7" }}>official DOHA calculator</a> before submitting your EOI.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {POINTS_CONFIG.map((section) => (
          <div key={section.id} style={{ background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0eeff", background: "#faf9ff" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#26215C" }}>{section.label}</div>
              {section.note && (
                section.note.startsWith("⚠️") ? (
                  <div style={{ fontSize: "12px", color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "6px", padding: "6px 10px", marginTop: "8px", lineHeight: 1.5 }}>
                    {section.note}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{section.note}</div>
                )
              )}
            </div>
            <div style={{ padding: "4px 0" }}>
              {section.options.map((opt) => {
                const selected = selections[section.id] === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setSelections((prev) => ({ ...prev, [section.id]: opt.value }))}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 18px",
                      border: "none",
                      background: selected ? "#EEEDFE" : "transparent",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "13.5px",
                      color: selected ? "#534AB7" : "#333",
                      fontWeight: selected ? 600 : 400,
                      textAlign: "left",
                      transition: "background .1s",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        width: "16px", height: "16px", borderRadius: "50%",
                        border: `2px solid ${selected ? "#534AB7" : "#ccc"}`,
                        background: selected ? "#534AB7" : "transparent",
                        flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                      </span>
                      {opt.label}
                    </span>
                    <span style={{
                      fontWeight: 700, fontSize: "13px",
                      color: opt.value > 0 ? (selected ? "#534AB7" : "#1B8F5E") : "#aaa",
                      minWidth: "48px", textAlign: "right",
                    }}>
                      {opt.value > 0 ? `+${opt.value} pts` : "0 pts"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "12px", padding: "16px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "#26215C", marginBottom: "10px" }}>Typical invitation scores (recent rounds)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {[
            { visa: "189", range: "85–95+", note: "Highly competitive" },
            { visa: "190", range: "65–80", note: "State dependent" },
            { visa: "491", range: "65–75", note: "More accessible" },
          ].map((v) => (
            <div key={v.visa} style={{ background: "#faf9ff", border: "1px solid #e8e6f8", borderRadius: "9px", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#534AB7" }}>{v.visa}</div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#26215C", margin: "2px 0" }}>{v.range}</div>
              <div style={{ fontSize: "11px", color: "#888" }}>{v.note}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#888", marginTop: "10px" }}>
          Scores vary by occupation and round. Check{" "}
          <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds" target="_blank" rel="noopener noreferrer" style={{ color: "#534AB7" }}>SkillSelect invitation rounds</a> for the latest data.
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Timeline Tracker ─────────────────────────────────────────────────

function TimelineTracker() {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ visa_type: "", state: "", year: "" });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visa_type: "485",
    lodged_month: "",
    granted_month: "",
    state_lodged: "NSW",
    occupation: "",
    notes: "",
    is_granted: false,
  });

  const statsQuery = useQuery({
    queryKey: ["visa-stats", filters],
    queryFn: () => getVisaStats({ ...filters }),
    staleTime: 1000 * 60 * 5,
  });

  const timelinesQuery = useQuery({
    queryKey: ["visa-timelines", filters],
    queryFn: () => getVisaTimelines({ ...filters }),
    staleTime: 1000 * 60 * 5,
  });

  const submitMutation = useMutation({
    mutationFn: submitVisaTimeline,
    onSuccess: () => {
      addToast("Timeline submitted — thank you!", "success");
      queryClient.invalidateQueries({ queryKey: ["visa-timelines"] });
      queryClient.invalidateQueries({ queryKey: ["visa-stats"] });
      setShowForm(false);
      setForm({ visa_type: "485", lodged_month: "", granted_month: "", state_lodged: "NSW", occupation: "", notes: "", is_granted: false });
    },
    onError: () => addToast("Failed to submit. Please try again.", "error"),
  });

  const stats = statsQuery.data;
  const timelines = timelinesQuery.data || [];
  const years = ["", "2023", "2024", "2025"].map((y) => ({ value: y, label: y || "All years" }));

  return (
    <div>
      <div style={{ background: "#EEEDFE", borderRadius: "14px", padding: "18px 22px", marginBottom: "20px" }}>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#26215C", lineHeight: 1.6 }}>
          <strong>Community-powered data.</strong> Real visa timelines submitted by Nepali Australians — month precision only, no personal details shared.
          The more people submit, the more useful this becomes for everyone.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <SelectInput value={filters.visa_type} onChange={(v) => setFilters((f) => ({ ...f, visa_type: v }))} options={VISA_TYPES} />
        <SelectInput value={filters.state} onChange={(v) => setFilters((f) => ({ ...f, state: v }))} options={AU_STATES} />
        <SelectInput value={filters.year} onChange={(v) => setFilters((f) => ({ ...f, year: v }))} options={years} />
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Submissions", value: stats.total_submissions },
            { label: "Median wait", value: stats.median_wait_months != null ? `${stats.median_wait_months} mo` : "—" },
            { label: "Fastest", value: stats.min_wait_months != null ? `${stats.min_wait_months} mo` : "—" },
            { label: "Still waiting", value: stats.still_waiting },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "10px", padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#26215C" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Submit button */}
      {isAuthenticated && (
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            marginBottom: "16px",
            background: showForm ? "#f0eeff" : "#534AB7",
            color: showForm ? "#534AB7" : "#fff",
            border: "1.5px solid #534AB7",
            borderRadius: "10px",
            padding: "10px 22px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {showForm ? "Cancel" : "+ Add my timeline"}
        </button>
      )}
      {!isAuthenticated && (
        <div style={{ marginBottom: "16px", fontSize: "13px", color: "#666" }}>
          <Link to="/login" style={{ color: "#534AB7", fontWeight: 600 }}>Sign in</Link> to add your timeline and help the community.
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#26215C", marginBottom: "16px" }}>Add your visa timeline</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={labelStyle}>
              Visa type *
              <SelectInput value={form.visa_type} onChange={(v) => setForm((f) => ({ ...f, visa_type: v }))}
                options={VISA_TYPES.slice(1)} style={{ width: "100%", marginTop: "4px" }} />
            </label>
            <label style={labelStyle}>
              State lodged *
              <SelectInput value={form.state_lodged} onChange={(v) => setForm((f) => ({ ...f, state_lodged: v }))}
                options={AU_STATES.slice(1)} style={{ width: "100%", marginTop: "4px" }} />
            </label>
            <label style={labelStyle}>
              Lodged (month) *
              <input type="month" value={form.lodged_month} onChange={(e) => setForm((f) => ({ ...f, lodged_month: e.target.value }))}
                style={inputStyle} required />
            </label>
            <label style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Granted (month)
                <label style={{ fontSize: "12px", fontWeight: 400, display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="checkbox" checked={form.is_granted} onChange={(e) => setForm((f) => ({ ...f, is_granted: e.target.checked }))} />
                  Granted
                </label>
              </span>
              <input type="month" value={form.granted_month} onChange={(e) => setForm((f) => ({ ...f, granted_month: e.target.value }))}
                disabled={!form.is_granted} style={{ ...inputStyle, opacity: form.is_granted ? 1 : .4 }} />
            </label>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              Occupation (optional)
              <input type="text" value={form.occupation} maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
                placeholder="e.g. Software Engineer, Registered Nurse" style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              Notes (optional)
              <textarea value={form.notes} maxLength={500} rows={3}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. skills assessment body, any useful context"
                style={{ ...inputStyle, resize: "vertical" }} />
            </label>
          </div>
          <button
            onClick={() => {
              if (!form.visa_type || !form.lodged_month || !form.state_lodged) {
                addToast("Please fill in visa type, lodged month, and state.", "error");
                return;
              }
              submitMutation.mutate(form);
            }}
            disabled={submitMutation.isPending}
            style={{
              marginTop: "14px",
              background: submitMutation.isPending ? "#ccc" : "#534AB7",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "11px 28px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: submitMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit timeline"}
          </button>
        </div>
      )}

      {/* Timeline list */}
      {timelinesQuery.isLoading ? (
        <div style={{ color: "#888", fontSize: "14px", padding: "20px 0" }}>Loading timelines…</div>
      ) : timelines.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "12px", padding: "36px", textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>📭</div>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>No timelines yet for these filters</div>
          <div style={{ fontSize: "13px", marginTop: "4px" }}>Be the first to add yours and help the community!</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#faf9ff" }}>
                  {["Visa", "Lodged", "Granted", "Wait", "State", "Occupation", "Notes"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#534AB7", borderBottom: "1.5px solid #e8e6f8", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timelines.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f0eeff" }}>
                    <td style={tdStyle}><span style={{ background: "#EEEDFE", color: "#534AB7", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "12px" }}>{t.visa_type}</span></td>
                    <td style={tdStyle}>{t.lodged_month}</td>
                    <td style={tdStyle}>{t.granted_month || <span style={{ color: "#ccc" }}>Waiting…</span>}</td>
                    <td style={tdStyle}>{t.wait_months != null ? <span style={{ fontWeight: 600, color: "#1B8F5E" }}>{t.wait_months} mo</span> : <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={tdStyle}>{t.state_lodged}</td>
                    <td style={tdStyle}>{t.occupation || <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={{ ...tdStyle, maxWidth: "200px", whiteSpace: "normal", fontSize: "12px", color: "#666" }}>{t.notes || <span style={{ color: "#ccc" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Resources ────────────────────────────────────────────────────────

function ResourcesTab() {
  return (
    <div>
      <div style={{ background: "#EEEDFE", borderRadius: "14px", padding: "16px 20px", marginBottom: "24px", fontSize: "13.5px", color: "#26215C" }}>
        <strong>All links open the official source.</strong> Always verify dates and requirements directly — immigration rules change frequently.
      </div>
      {RESOURCES.map((section) => (
        <div key={section.category} style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "18px" }}>{section.icon}</span>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#26215C" }}>{section.category}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {section.items.map((item) => (
              item.internal ? (
                <Link
                  key={item.title}
                  to={item.url}
                  style={resourceCardStyle}
                >
                  <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#534AB7" }}>{item.title}</div>
                  <div style={{ fontSize: "12.5px", color: "#666", marginTop: "3px" }}>{item.description}</div>
                </Link>
              ) : (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={resourceCardStyle}
                >
                  <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#534AB7" }}>{item.title} ↗</div>
                  <div style={{ fontSize: "12.5px", color: "#666", marginTop: "3px" }}>{item.description}</div>
                </a>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 4: Occupation Search ────────────────────────────────────────────────

const VISA_COLORS = { '189': '#534AB7', '190': '#1B8F5E', '491': '#E87722' };

const LIST_BADGE = {
  MLTSSL: { bg: '#dcfce7', color: '#15803d', label: 'MLTSSL' },
  STSOL:  { bg: '#fef9c3', color: '#a16207', label: 'STSOL' },
  ROL:    { bg: '#dbeafe', color: '#1d4ed8', label: 'ROL' },
  NONE:   { bg: '#f3f4f6', color: '#6b7280', label: 'Not listed' },
};

const LIST_FULL = {
  MLTSSL: 'Medium and Long-term Strategic Skills List — eligible for 189, 190, 491',
  STSOL:  'Short-term Skilled Occupation List — eligible for 190, 491, 482',
  ROL:    'Regional Occupation List — eligible for 491 (regional only)',
  NONE:   'Not currently on any skilled occupation list',
};

function OccupationSearch() {
  const [query, setQuery] = useState('');
  const [filterList, setFilterList] = useState('');

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['occupations'],
    queryFn: () => getOccupations(),
    staleTime: 1000 * 60 * 30,
  });

  const q = query.trim().toLowerCase();
  const results = all.filter((o) => {
    const matchesQ =
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.anzsco_code.includes(q) ||
      (o.alternative_titles && o.alternative_titles.toLowerCase().includes(q));
    const matchesList = !filterList || o.list_type === filterList;
    return matchesQ && matchesList;
  });

  return (
    <div>
      <div style={{ background: '#EEEDFE', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', fontSize: '13.5px', color: '#26215C', lineHeight: 1.6 }}>
        <strong>Is your occupation on the skills list?</strong> Search below to find your ANZSCO code and see which skilled visas you may be eligible for.
        Data sourced from the DOHA Skilled Occupation List (August 2025) —{' '}
        <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7' }}>
          verify at doha.gov.au ↗
        </a>{' '}
        before relying on this for visa purposes.
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by job title or ANZSCO code…"
          style={{
            flex: 1,
            minWidth: '220px',
            border: '1.5px solid #ddd',
            borderRadius: '9px',
            padding: '10px 14px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <SelectInput
          value={filterList}
          onChange={setFilterList}
          options={[
            { value: '', label: 'All lists' },
            { value: 'MLTSSL', label: 'MLTSSL' },
            { value: 'STSOL',  label: 'STSOL' },
            { value: 'ROL',    label: 'ROL' },
          ]}
        />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.entries(LIST_BADGE).filter(([k]) => k !== 'NONE').map(([key, { bg, color, label }]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ background: bg, color, borderRadius: '5px', padding: '2px 8px', fontWeight: 700 }}>{label}</span>
            <span style={{ color: '#666' }}>{LIST_FULL[key].split('—')[0].trim()}</span>
          </div>
        ))}
      </div>

      {/* Results count */}
      {!isLoading && (
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
          {results.length} occupation{results.length !== 1 ? 's' : ''} found
          {q && ` for "${query}"`}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div style={{ color: '#888', fontSize: '14px', padding: '24px 0' }}>Loading occupations…</div>
      ) : results.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>No occupations found</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>
            Try a different title or{' '}
            <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7' }}>
              search the full DOHA list ↗
            </a>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map((o) => {
            const badge = LIST_BADGE[o.list_type] || LIST_BADGE.NONE;
            const visas = o.eligible_visas ? o.eligible_visas.split(',') : [];
            return (
              <div key={o.id} style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#26215C' }}>{o.title}</span>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: '6px', padding: '2px 9px', fontSize: '11.5px', fontWeight: 700 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                      ANZSCO {o.anzsco_code}
                      {o.alternative_titles && <span> · Also known as: {o.alternative_titles}</span>}
                    </div>
                    {o.notes && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>ℹ️ {o.notes}</div>
                    )}
                  </div>
                  {visas.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>Eligible visas</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {visas.map((v) => (
                          <span key={v} style={{ background: '#EEEDFE', color: '#534AB7', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: 700 }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {o.invitations && o.invitations.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0eeff' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>
                      Recent SkillSelect
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {o.invitations.map((inv) => (
                        <span
                          key={`${inv.round_date}-${inv.visa_type}`}
                          title={inv.notes || undefined}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: inv.was_invited ? '#dcfce7' : '#fee2e2',
                            border: `1px solid ${inv.was_invited ? '#86efac' : '#fca5a5'}`,
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: inv.was_invited ? '#15803d' : '#dc2626',
                            cursor: 'default',
                          }}
                        >
                          {inv.was_invited ? '✓' : '✗'}
                          {' '}{inv.round_date}{' '}
                          <span style={{ background: VISA_COLORS[inv.visa_type] || '#534AB7', color: '#fff', borderRadius: '3px', padding: '0 4px', fontSize: '10px', fontWeight: 700 }}>
                            {inv.visa_type}
                          </span>
                          {inv.was_invited && inv.score != null && ` ${inv.score} pts`}
                          {!inv.was_invited && ' not invited'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
        58 occupations listed · Last updated August 2025 ·{' '}
        <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7' }}>
          Full DOHA list ↗
        </a>
      </div>
    </div>
  );
}

// ─── Tab 5: Invitation Rounds ────────────────────────────────────────────────

function InvitationHistory() {
  const [visaFilter, setVisaFilter] = useState('');

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ['invitation-rounds', visaFilter],
    queryFn: () => getInvitationRounds(visaFilter ? { visa_type: visaFilter } : {}),
    staleTime: 1000 * 60 * 15,
  });

  // Build sparkline data per visa type
  const byVisa = {};
  rounds.forEach((r) => {
    if (r.lowest_score == null) return; // skip rounds with no score for chart
    if (!byVisa[r.visa_type]) byVisa[r.visa_type] = [];
    byVisa[r.visa_type].push({ date: r.round_date, score: r.lowest_score });
  });
  Object.values(byVisa).forEach((arr) => arr.sort((a, b) => a.date.localeCompare(b.date)));

  const filtered = visaFilter ? rounds.filter((r) => r.visa_type === visaFilter) : rounds;

  return (
    <div>
      <div style={{ background: '#EEEDFE', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', fontSize: '13.5px', color: '#26215C', lineHeight: 1.6 }}>
        <strong>SkillSelect invitation round history.</strong> Lowest points score required in each round — shows whether competition is increasing or easing over time.
        Source:{' '}
        <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7' }}>
          DOHA SkillSelect invitation rounds ↗
        </a>
      </div>

      {/* Trend sparklines (only when we have data for multiple visa types) */}
      {Object.keys(byVisa).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {Object.entries(byVisa).map(([visa, points]) => {
            if (points.length < 2) return null;
            const scores = points.map((p) => p.score);
            const minS = Math.min(...scores) - 5;
            const maxS = Math.max(...scores) + 5;
            const W = 200, H = 60;
            const px = (i) => (i / (points.length - 1)) * W;
            const py = (s) => H - ((s - minS) / (maxS - minS)) * H;
            const polyline = points.map((p, i) => `${px(i)},${py(p.score)}`).join(' ');
            const latest = points[points.length - 1];
            const prev = points[points.length - 2];
            const trend = latest.score > prev.score ? '↑' : latest.score < prev.score ? '↓' : '→';
            const trendColor = latest.score > prev.score ? '#dc2626' : latest.score < prev.score ? '#16a34a' : '#888';

            return (
              <div key={visa} style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ background: '#EEEDFE', color: VISA_COLORS[visa] || '#534AB7', borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 800 }}>
                    {visa}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: VISA_COLORS[visa] || '#26215C' }}>{latest.score}</span>
                    <span style={{ fontSize: '16px', color: trendColor, marginLeft: '4px', fontWeight: 700 }}>{trend}</span>
                    <div style={{ fontSize: '10px', color: '#888' }}>pts ({latest.date})</div>
                  </div>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '50px' }}>
                  <defs>
                    <linearGradient id={`grad-${visa}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={VISA_COLORS[visa] || '#534AB7'} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={VISA_COLORS[visa] || '#534AB7'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,${H} ${polyline} ${W},${H}`}
                    fill={`url(#grad-${visa})`}
                  />
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke={VISA_COLORS[visa] || '#534AB7'}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx={px(points.length - 1)} cy={py(latest.score)} r="3" fill={VISA_COLORS[visa] || '#534AB7'} />
                </svg>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <SelectInput
          value={visaFilter}
          onChange={setVisaFilter}
          options={[
            { value: '', label: 'All visa types' },
            { value: '189', label: '189 — Skilled Independent' },
            { value: '190', label: '190 — Skilled Nominated' },
            { value: '491', label: '491 — Skilled Work Regional' },
          ]}
        />
        <span style={{ fontSize: '12px', color: '#888' }}>{filtered.length} round{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table or empty state */}
      {isLoading ? (
        <div style={{ color: '#888', fontSize: '14px', padding: '24px 0' }}>Loading rounds…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>📊</div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>No invitation rounds data yet</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
            An administrator runs <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>python manage.py fetch_invitation_rounds</code>
            {' '}to pull the latest data from DOHA, or rounds can be entered manually via the admin panel.
          </div>
          <a
            href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: '14px', color: '#534AB7', fontWeight: 600, fontSize: '13px' }}
          >
            View current rounds at DOHA ↗
          </a>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf9ff' }}>
                  {['Round', 'Visa', 'Min Score', 'Invitations', 'Tiebreaker Date'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#534AB7', borderBottom: '1.5px solid #e8e6f8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0eeff' }}>
                    <td style={tdStyle}>{r.round_date}</td>
                    <td style={tdStyle}>
                      <span style={{ background: '#EEEDFE', color: VISA_COLORS[r.visa_type] || '#534AB7', padding: '2px 9px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
                        {r.visa_type}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, fontSize: '15px', color: r.lowest_score != null ? (VISA_COLORS[r.visa_type] || '#26215C') : '#aaa' }}>
                      {r.lowest_score != null ? `${r.lowest_score} pts` : 'varies by occupation'}
                    </td>
                    <td style={tdStyle}>
                      {r.invitations_issued ? r.invitations_issued.toLocaleString() : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#666' }}>{r.tiebreaker_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tax calculation helpers ─────────────────────────────────────────────────

function calcIncomeTax(income, isResident) {
  if (!isResident) {
    if (income <= 120000) return income * 0.325;
    if (income <= 180000) return 39000 + (income - 120000) * 0.37;
    return 61200 + (income - 180000) * 0.45;
  }
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.19;
  if (income <= 120000) return 5092 + (income - 45000) * 0.325;
  if (income <= 180000) return 29467 + (income - 120000) * 0.37;
  return 51667 + (income - 180000) * 0.45;
}

function calcLITO(income, isResident) {
  if (!isResident) return 0;
  if (income <= 37500) return 700;
  if (income <= 45000) return 700 - (income - 37500) * 0.05;
  if (income <= 66667) return Math.max(0, 325 - (income - 45000) * 0.015);
  return 0;
}

function calcMedicare(income, isResident, exempt) {
  if (!isResident || exempt) return 0;
  if (income <= 26000) return 0;
  if (income <= 32500) return (income - 26000) * 0.1; // shade-in rate
  return income * 0.02;
}

function calcMLS(income, isResident, hasPrivateCover) {
  if (!isResident || hasPrivateCover || income <= 93000) return 0;
  if (income <= 108000) return income * 0.01;
  if (income <= 144000) return income * 0.0125;
  return income * 0.015;
}

// HECS/HELP compulsory repayment — 2024-25 thresholds (ATO)
function calcHECS(income) {
  const tiers = [
    [152619, 0.10], [143959, 0.095], [135839, 0.09], [128179, 0.085],
    [120899, 0.08],  [114097, 0.075], [107974, 0.07], [101900, 0.065],
    [96395, 0.06],   [91982, 0.055],  [88493, 0.05],  [84108, 0.045],
    [79348, 0.04],   [74856, 0.035],  [70520, 0.03],  [66530, 0.025],
    [62739, 0.02],   [54436, 0.01],
  ];
  for (const [min, rate] of tiers) {
    if (income >= min) return Math.round(income * rate);
  }
  return 0;
}

function fmtAUD(n) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

const PAY_PERIODS = [
  { value: '52', label: 'Weekly' },
  { value: '26', label: 'Fortnightly' },
  { value: '12', label: 'Monthly' },
  { value: '1',  label: 'Annually' },
];

function TaxToggle({ label, active, onToggle, note }) {
  return (
    <button onClick={onToggle} title={note} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: '9px', border: '1.5px solid',
      borderColor: active ? '#534AB7' : '#ddd',
      background: active ? '#EEEDFE' : '#fff',
      color: active ? '#534AB7' : '#666',
      fontWeight: active ? 600 : 400,
      fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${active ? '#534AB7' : '#ccc'}`, background: active ? '#534AB7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
      </span>
      {label}
    </button>
  );
}

function TaxRow({ label, value, color, bold, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: last ? 'none' : '1px solid #f8f7ff' }}>
      <span style={{ fontSize: '13px', color: '#555', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: bold ? 800 : 600, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

// ─── Sub-calculator: Tax Return Estimator ────────────────────────────────────

function TaxReturnEstimator() {
  const [income, setIncome] = useState('');
  const [withheld, setWithheld] = useState('');
  const [isResident, setIsResident] = useState(true);
  const [medicareExempt, setMedicareExempt] = useState(false);
  const [hasPrivateCover, setHasPrivateCover] = useState(true);

  const inc  = parseFloat(income) || 0;
  const wth  = parseFloat(withheld) || 0;
  const ready = inc > 0 && withheld !== '';

  const tax      = calcIncomeTax(inc, isResident);
  const lito     = calcLITO(inc, isResident);
  const medicare = calcMedicare(inc, isResident, medicareExempt);
  const mls      = calcMLS(inc, isResident, hasPrivateCover);
  const totalLiability = Math.max(0, tax - lito + medicare + mls);
  const diff     = wth - totalLiability;
  const isRefund = diff >= 0;
  const effectiveRate = inc > 0 ? ((totalLiability / inc) * 100).toFixed(1) : 0;

  return (
    <div>
      <div style={{ background: '#EEEDFE', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', fontSize: '13.5px', color: '#26215C', lineHeight: 1.6 }}>
        <strong>2024–25 financial year.</strong> Enter your annual income and total tax withheld from your payslips. We'll calculate your ATO liability and show if you're getting a refund or owe more.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>
          Total income (gross annual) *
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#888', pointerEvents: 'none' }}>$</span>
            <input type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 75000" style={{ ...inputStyle, paddingLeft: '26px', marginTop: 0 }} />
          </div>
        </label>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>
          Tax withheld from payslips *
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#888', pointerEvents: 'none' }}>$</span>
            <input type="number" min="0" value={withheld} onChange={(e) => setWithheld(e.target.value)}
              placeholder="e.g. 16000" style={{ ...inputStyle, paddingLeft: '26px', marginTop: 0 }} />
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <TaxToggle label="Australian resident for tax" active={isResident} onToggle={() => setIsResident((v) => !v)}
          note="Non-residents pay 32.5% from $1 — no tax-free threshold, no LITO" />
        <TaxToggle label="Medicare Levy exempt" active={medicareExempt} onToggle={() => setMedicareExempt((v) => !v)}
          note="Some temporary visa holders are exempt — check your Notice of Medicare Entitlement (NOMC)" />
        <TaxToggle label="Have private hospital cover" active={hasPrivateCover} onToggle={() => setHasPrivateCover((v) => !v)}
          note="Without private cover, high earners (>$93k) pay Medicare Levy Surcharge on top" />
      </div>

      {ready && (
        <>
          <div style={{ background: isRefund ? '#f0fdf4' : '#fff5f5', border: `2px solid ${isRefund ? '#86efac' : '#fca5a5'}`, borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: isRefund ? '#15803d' : '#dc2626', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
              {isRefund ? '🎉 Estimated tax refund' : '⚠️ Estimated tax owing'}
            </div>
            <div style={{ fontSize: '52px', fontWeight: 800, color: isRefund ? '#15803d' : '#dc2626', letterSpacing: '-.02em', lineHeight: 1 }}>
              {fmtAUD(diff)}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
              Effective tax rate: <strong>{effectiveRate}%</strong>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '11px 18px', background: '#faf9ff', borderBottom: '1px solid #f0eeff', fontSize: '11px', fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Tax breakdown
            </div>
            <TaxRow label="Gross income"                                          value={fmtAUD(inc)}                                                  color="#26215C" />
            <TaxRow label="Income tax (ATO 2024–25 brackets)"                     value={`−${fmtAUD(tax)}`}                                            color="#dc2626" />
            {lito > 0 && <TaxRow label="Low Income Tax Offset (LITO)"            value={`+${fmtAUD(lito)}`}                                           color="#1B8F5E" />}
            <TaxRow label={`Medicare Levy (2%)${medicareExempt ? ' — exempt' : ''}`} value={medicare > 0 ? `−${fmtAUD(medicare)}` : '$0'}            color={medicare > 0 ? '#dc2626' : '#aaa'} />
            {mls > 0 && <TaxRow label="Medicare Levy Surcharge"                  value={`−${fmtAUD(mls)}`}                                            color="#dc2626" />}
            <TaxRow label="Total tax liability"                                   value={fmtAUD(totalLiability)}                                       color="#26215C" bold />
            <TaxRow label="Tax withheld (from payslips)"                          value={fmtAUD(wth)}                                                  color="#534AB7" last />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: isRefund ? '#f0fdf4' : '#fff5f5' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#26215C' }}>{isRefund ? 'Estimated refund' : 'Estimated tax owing'}</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: isRefund ? '#15803d' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{fmtAUD(diff)}</span>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
        Estimate only — 2024–25 ATO rates. Does not include deductions, HECS/HELP, salary packaging, or offsets beyond LITO.{' '}
        <a href="https://www.ato.gov.au/individuals-and-families/your-tax-return" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7' }}>Lodge at ATO ↗</a>
      </div>
    </div>
  );
}

// ─── Sub-calculator: Take-Home Pay ───────────────────────────────────────────

function TakeHomeCalculator() {
  const [gross, setGross] = useState('');
  const [period, setPeriod] = useState('52');
  const [isResident, setIsResident] = useState(true);
  const [claimThreshold, setClaimThreshold] = useState(true);
  const [medicareExempt, setMedicareExempt] = useState(false);
  const [hasHecs, setHasHecs] = useState(false);

  const grossAmt = parseFloat(gross) || 0;
  const periodsPerYear = parseInt(period, 10);
  const annualGross = grossAmt * periodsPerYear;

  const baseTax  = calcIncomeTax(annualGross, isResident);
  const lito     = (isResident && claimThreshold) ? calcLITO(annualGross, isResident) : 0;
  // Not claiming threshold: ATO Scale 2 adds ~$3,519/yr extra withholding
  const scaleAdj = (isResident && !claimThreshold) ? 3519 : 0;
  const annualTax = Math.max(0, baseTax - lito + scaleAdj);
  const annualMedicare = calcMedicare(annualGross, isResident, medicareExempt);
  const annualHECS = hasHecs ? calcHECS(annualGross) : 0;
  const annualNet = annualGross - annualTax - annualMedicare - annualHECS;

  const pp = (v) => v / periodsPerYear;
  const effectiveRate = annualGross > 0 ? (((annualTax + annualMedicare + annualHECS) / annualGross) * 100).toFixed(1) : 0;
  const periodLabel = PAY_PERIODS.find((p) => p.value === period)?.label || '';
  const ready = grossAmt > 0;

  return (
    <div>
      <div style={{ background: '#EEEDFE', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', fontSize: '13.5px', color: '#26215C', lineHeight: 1.6 }}>
        <strong>Take-home pay estimator.</strong> Enter your gross (before-tax) pay and pay period. Toggle HECS/HELP if you have a student loan — it's withheld separately from income tax. Results are an estimate; super and salary packaging are not included.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>
          Gross pay (before tax) *
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#888', pointerEvents: 'none' }}>$</span>
            <input type="number" min="0" value={gross} onChange={(e) => setGross(e.target.value)}
              placeholder="e.g. 1200" style={{ ...inputStyle, paddingLeft: '26px', marginTop: 0 }} />
          </div>
        </label>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>
          Pay period
          <div style={{ marginTop: '6px' }}>
            <SelectInput value={period} onChange={setPeriod} options={PAY_PERIODS} style={{ width: '100%' }} />
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <TaxToggle label="Australian resident for tax" active={isResident} onToggle={() => setIsResident((v) => !v)}
          note="Non-residents pay 32.5% from $1 — no tax-free threshold" />
        <TaxToggle label="Claiming tax-free threshold" active={claimThreshold} onToggle={() => setClaimThreshold((v) => !v)}
          note="Disable if this is your second job — you can only claim the threshold from one employer at a time" />
        <TaxToggle label="Medicare Levy exempt" active={medicareExempt} onToggle={() => setMedicareExempt((v) => !v)}
          note="Some temporary visa holders are exempt — check your NOMC" />
        <TaxToggle label="Has HECS/HELP debt" active={hasHecs} onToggle={() => setHasHecs((v) => !v)}
          note="Domestic students with a student loan have compulsory repayments withheld from each payslip" />
      </div>

      {ready && (
        <>
          <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
              💸 {periodLabel} take-home
            </div>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#15803d', letterSpacing: '-.02em', lineHeight: 1 }}>
              {fmtAUD(pp(annualNet))}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
              Effective tax rate: <strong>{effectiveRate}%</strong> · Annual take-home: <strong>{fmtAUD(annualNet)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { title: `${periodLabel} breakdown`, rows: [
                { label: 'Gross pay',         value: fmtAUD(pp(annualGross)),       color: '#26215C' },
                { label: 'Income tax',        value: `−${fmtAUD(pp(annualTax))}`,   color: '#dc2626' },
                { label: `Medicare Levy${medicareExempt ? ' (exempt)' : ''}`, value: pp(annualMedicare) > 0 ? `−${fmtAUD(pp(annualMedicare))}` : '$0', color: pp(annualMedicare) > 0 ? '#dc2626' : '#aaa' },
                ...(hasHecs ? [{ label: 'HECS/HELP repayment', value: `−${fmtAUD(pp(annualHECS))}`, color: '#d97706' }] : []),
                { label: 'Net (take-home)',   value: fmtAUD(pp(annualNet)),          color: '#1B8F5E', bold: true },
              ]},
              { title: 'Annual equivalent', rows: [
                { label: 'Annual gross',      value: fmtAUD(annualGross),            color: '#26215C' },
                { label: 'Annual tax',        value: `−${fmtAUD(annualTax)}`,        color: '#dc2626' },
                { label: 'Annual Medicare',   value: annualMedicare > 0 ? `−${fmtAUD(annualMedicare)}` : '$0', color: annualMedicare > 0 ? '#dc2626' : '#aaa' },
                ...(hasHecs ? [{ label: 'Annual HECS/HELP',   value: `−${fmtAUD(annualHECS)}`,       color: '#d97706' }] : []),
                { label: 'Annual take-home',  value: fmtAUD(annualNet),              color: '#1B8F5E', bold: true },
              ]},
            ].map(({ title, rows }) => (
              <div key={title} style={{ background: '#fff', border: '1.5px solid #e8e6f8', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: '#faf9ff', borderBottom: '1px solid #f0eeff', fontSize: '11px', fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {title}
                </div>
                {rows.map(({ label, value, color, bold }, i) => (
                  <TaxRow key={label} label={label} value={value} color={color} bold={bold} last={i === rows.length - 1} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#aaa', textAlign: 'center', lineHeight: 1.6 }}>
        Based on 2024–25 ATO tax brackets.{' '}
        <span style={{ color: '#888' }}>
          Your payslip may show a slightly different amount (±$5–10/week) because employers use pre-computed PAYG withholding tables — any difference is reconciled at tax return time.
        </span>
        {' '}Does not include super or salary packaging.
      </div>
    </div>
  );
}

// ─── Tab 6: Tax Calculator ───────────────────────────────────────────────────

function TaxCalculatorTab() {
  const [mode, setMode] = useState('return');
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'return',   label: '📋 Tax Return Estimator' },
          { id: 'takehome', label: '💵 Take-Home Pay' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setMode(id)} style={{
            padding: '9px 20px', borderRadius: '8px', border: '1.5px solid',
            borderColor: mode === id ? '#534AB7' : '#ddd',
            background: mode === id ? '#EEEDFE' : '#fff',
            color: mode === id ? '#534AB7' : '#666',
            fontWeight: mode === id ? 700 : 500,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'return' ? <TaxReturnEstimator /> : <TakeHomeCalculator />}
    </div>
  );
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#444",
};

const inputStyle = {
  border: "1.5px solid #ddd",
  borderRadius: "9px",
  padding: "9px 12px",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  marginTop: "4px",
};

const tdStyle = {
  padding: "11px 14px",
  fontSize: "13px",
  color: "#333",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const resourceCardStyle = {
  display: "block",
  background: "#fff",
  border: "1.5px solid #e8e6f8",
  borderRadius: "10px",
  padding: "12px 16px",
  textDecoration: "none",
  transition: "border-color .15s",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VisaHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "occupations";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  usePageMeta(
    "Visa & Immigration Hub — NepSaathi",
    "ANZSCO occupation search, invitation round history, PR points calculator, and community visa timelines for Nepali Australians.",
    "visa australia nepali, ANZSCO occupation search, PR points calculator, skilled migration invitation rounds, 485 visa timeline, nepal australia"
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 64px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#534AB7", marginBottom: "8px" }}>
          Visa &amp; Immigration Hub
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#26215C", letterSpacing: "-.02em", margin: "0 0 10px" }}>
          Navigate your Australian visa journey
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0, lineHeight: 1.6 }}>
          ANZSCO occupation lookup, invitation round history, PR points calculator, community timelines, and curated official resources — built for Nepali Australians.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        <TabBtn label="🔢 PR Calculator"       active={tab === "calculator"}   onClick={() => setTab("calculator")} />
        <TabBtn label="🔍 Occupation Search"   active={tab === "occupations"}  onClick={() => setTab("occupations")} />
        <TabBtn label="📈 Invitation History"  active={tab === "invitations"}  onClick={() => setTab("invitations")} />
        <TabBtn label="🧾 Tax Calculator"      active={tab === "tax"}          onClick={() => setTab("tax")} />
        <TabBtn label="📊 Timeline Tracker"    active={tab === "timelines"}    onClick={() => setTab("timelines")} />
        <TabBtn label="📚 Resources"           active={tab === "resources"}    onClick={() => setTab("resources")} />
      </div>

      {/* Content */}
      {tab === "calculator"  && <PRCalculator />}
      {tab === "occupations" && <OccupationSearch />}
      {tab === "invitations" && <InvitationHistory />}
      {tab === "tax"         && <TaxCalculatorTab />}
      {tab === "timelines"   && <TimelineTracker />}
      {tab === "resources"   && <ResourcesTab />}
    </div>
  );
}
