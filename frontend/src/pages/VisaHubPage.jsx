import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import useAuthStore from "../store/authStore";
import { useToast } from "../components/ui/Toast";
import {
  getVisaTimelines,
  getVisaStats,
  submitVisaTimeline,
  updateVisaTimeline,
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

// ─── Tab 1: PR Calculator ────────────────────────────────────────────────────

function PRCalculator() {
  const [selections, setSelections] = useState({});
  const [visaType, setVisaType] = useState("189");

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
        </div>
      </div>

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
  const [tab, setTab] = useState("calculator");

  usePageMeta(
    "Visa & Immigration Hub — NepSaathi",
    "PR points calculator, community visa timelines, and official immigration resources for Nepali Australians.",
    "visa australia nepali, PR points calculator, 485 visa timeline, skilled migration nepal australia"
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
          PR points calculator, community timeline tracker, and curated official resources — built for Nepali Australians.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        <TabBtn label="🔢 PR Calculator" active={tab === "calculator"} onClick={() => setTab("calculator")} />
        <TabBtn label="📊 Timeline Tracker" active={tab === "timelines"} onClick={() => setTab("timelines")} />
        <TabBtn label="📚 Resources" active={tab === "resources"} onClick={() => setTab("resources")} />
      </div>

      {/* Content */}
      {tab === "calculator" && <PRCalculator />}
      {tab === "timelines" && <TimelineTracker />}
      {tab === "resources" && <ResourcesTab />}
    </div>
  );
}
