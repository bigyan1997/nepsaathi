import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing, deleteListing, aiImproveDescription } from "../../api/listings";
import { createJob } from "../../api/jobs";
import { createRoom } from "../../api/rooms";
import { createNotice } from "../../api/notices";
import { createEvent } from "../../api/events";
import ImageUpload from "../../components/ui/ImageUpload";
import usePageTitle from "../../hooks/usePageTitle";
import AddressAutocomplete from "../../components/ui/AddressAutocomplete";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/ui/Toast";

/* ── constants ── */
const LISTING_TYPES = [
  {
    value: "job",
    label: "Job",
    emoji: "💼",
    desc: "Post a vacancy or find work",
    bg: "#EEEDFE",
    border: "#AFA9EC",
    color: "#3C3489",
  },
  {
    value: "room",
    label: "Room",
    emoji: "🏠",
    desc: "List a room or find accommodation",
    bg: "#FFF1E0",
    border: "#EFD9C0",
    color: "#633806",
  },
  {
    value: "event",
    label: "Event",
    emoji: "🎉",
    desc: "Share a community event",
    bg: "#E1F5EE",
    border: "#9FE1CB",
    color: "#085041",
  },
  {
    value: "notice",
    label: "Notice",
    emoji: "📢",
    desc: "Share news or items for sale",
    bg: "#E6F1FB",
    border: "#B5D4F4",
    color: "#0C447C",
  },
];

const STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

const JOB_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "casual", label: "Casual" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];
const SALARY_TYPES = [
  { value: "hourly", label: "Per hour" },
  { value: "weekly", label: "Per week" },
  { value: "monthly", label: "Per month" },
  { value: "yearly", label: "Per year" },
  { value: "negotiable", label: "Negotiable" },
];
const ROOM_TYPES = [
  { value: "private", label: "Private room" },
  { value: "shared", label: "Shared room" },
  { value: "entire", label: "Entire property" },
  { value: "studio", label: "Studio" },
];
const FURNISHINGS = [
  { value: "furnished", label: "Fully furnished" },
  { value: "partial", label: "Partially furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

/* ── style helpers ── */
const inputStyle = {
  width: "100%",
  border: "0.5px solid #ddd",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
  color: "#26215C",
  boxSizing: "border-box",
};
const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#555",
  display: "block",
  marginBottom: "5px",
};

/* ── reusable components ── */
function SectionCard({ title, accent, accentBg, accentBorder, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
        marginBottom: "12px",
      }}
    >
      <div
        className="pa-section-header"
        style={{
          background: accentBg,
          borderBottom: `0.5px solid ${accentBorder}`,
          padding: "12px 20px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700, color: accent }}>
          {title}
        </div>
      </div>
      <div
        className="pa-section-body"
        style={{
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CheckCard({
  checked,
  onChange,
  label,
  sublabel,
  color = "#534AB7",
  bg = "#EEEDFE",
  border = "#AFA9EC",
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        background: checked ? bg : "#F5F4F0",
        border: `0.5px solid ${checked ? border : "#e5e5e5"}`,
        borderRadius: "10px",
        padding: "12px 14px",
        transition: "all 0.15s",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          width: "16px",
          height: "16px",
          flexShrink: 0,
          accentColor: color,
        }}
      />
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#26215C" }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
            {sublabel}
          </div>
        )}
      </div>
    </label>
  );
}

function Grid2({ children }) {
  return (
    <div
      className="pa-grid2"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
    >
      {children}
    </div>
  );
}

function WantedToggle({ isWanted, listingType, onChange }) {
  const cfg =
    listingType === "job"
      ? {
          emoji: "🔍",
          label: "I'm looking for a job",
          sub: "Toggle on if you're seeking work, not hiring",
          bg: "#EEEDFE",
          border: "#AFA9EC",
          color: "#534AB7",
        }
      : {
          emoji: "🏘️",
          label: "I'm looking for a room",
          sub: "Toggle on if you're seeking accommodation",
          bg: "#FFF1E0",
          border: "#EFD9C0",
          color: "#E87722",
        };

  return (
    <div
      onClick={onChange}
      style={{
        background: isWanted ? cfg.bg : "#F5F4F0",
        border: `1.5px solid ${isWanted ? cfg.border : "#e5e5e5"}`,
        borderRadius: "12px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "22px" }}>{cfg.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#26215C" }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
            {cfg.sub}
          </div>
        </div>
        {/* Toggle pill */}
        <div
          style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            background: isWanted ? cfg.color : "#ccc",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "2px",
              left: isWanted ? "22px" : "2px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel,
  loading,
  nextColor = "#E87722",
}) {
  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            flex: 1,
            background: "#fff",
            color: "#555",
            border: "0.5px solid #ccc",
            borderRadius: "9px",
            padding: "12px",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={loading}
        style={{
          flex: 2,
          background: loading ? "#ccc" : nextColor,
          color: "#fff",
          border: "none",
          borderRadius: "9px",
          padding: "12px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Posting..." : nextLabel}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function PostAdPage() {
  usePageTitle("Post a Free Ad");
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listingType, setListingType] = useState("");
  const [createdListingId, setCreatedListingId] = useState(null);
  const [createdListingSlug, setCreatedListingSlug] = useState(null);

  const [baseForm, setBaseForm] = useState({
    title: "",
    description: "",
    location: "",
    state: "NSW",
    postcode: "",
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
    is_wanted: false,
  });
  const [jobForm, setJobForm] = useState({
    company_name: "",
    job_type: "casual",
    salary: "",
    salary_type: "hourly",
    experience_required: "",
    qualifications: "",
    is_urgent: false,
  });
  const [roomForm, setRoomForm] = useState({
    room_type: "private",
    price: "",
    furnishing: "furnished",
    bond: "4_weeks",
    bills_included: false,
    available_from: "",
    bedrooms: 1,
    bathrooms: 1,
    max_occupants: 1,
    nepalese_household: false,
    pets_allowed: false,
    parking_available: false,
    street_address: "",
  });
  const [noticeForm, setNoticeForm] = useState({
    category: "general",
    price: "",
    condition: "na",
    is_free: false,
    is_urgent: false,
  });
  const [eventForm, setEventForm] = useState({
    category: "community",
    event_date: "",
    event_end_date: "",
    venue: "",
    organiser: "",
    is_free: true,
    ticket_price: "",
    max_attendees: "",
    is_online: false,
    event_url: "",
  });

  const [aiState, setAiState] = useState({ loading: false, preview: null, error: null });

  async function handleAiImprove() {
    if (!baseForm.description.trim() || aiState.loading) return;
    setAiState({ loading: true, preview: null, error: null });
    try {
      const res = await aiImproveDescription({
        title: baseForm.title,
        description: baseForm.description,
        listing_type: listingType,
        location: baseForm.location,
        state: baseForm.state,
      });
      setAiState({ loading: false, preview: res.improved, error: null });
    } catch (e) {
      const msg = e?.response?.data?.error || "Could not improve description. Try again.";
      setAiState({ loading: false, preview: null, error: msg });
    }
  }

  const setBase = (f) => (e) =>
    setBaseForm((p) => ({ ...p, [f]: e.target.value }));
  const setJob = (f) => (e) =>
    setJobForm((p) => ({ ...p, [f]: e.target.value }));
  const setRoom = (f) => (e) =>
    setRoomForm((p) => ({ ...p, [f]: e.target.value }));
  const setAnn = (f) => (e) =>
    setNoticeForm((p) => ({ ...p, [f]: e.target.value }));
  const setEvt = (f) => (e) =>
    setEventForm((p) => ({ ...p, [f]: e.target.value }));

  const typeConfig = LISTING_TYPES.find((t) => t.value === listingType) || {};

  const STEP_LABELS = [
    "Choose type",
    "Basic details",
    "Specific details",
    "Add photos",
  ];

  /* ── submit ── */
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    let baseListingSlug;
    try {
      const listing = await createListing({
        ...baseForm,
        listing_type: listingType,
      });
      if (!listing.id) {
        setError("Failed to create listing. Please try again.");
        return;
      }
      baseListingSlug = listing.slug;

      if (listingType === "job") {
        await createJob({
          listing: listing.id,
          ...jobForm,
          salary: jobForm.salary || null,
        });
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        queryClient.invalidateQueries({ queryKey: ["home-jobs"] });
      } else if (listingType === "room") {
        await createRoom({ listing: listing.id, ...roomForm });
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
        queryClient.invalidateQueries({ queryKey: ["home-rooms"] });
      } else if (listingType === "notice") {
        await createNotice({
          listing: listing.id,
          category: noticeForm.category,
          price: noticeForm.price || null,
          condition: noticeForm.condition,
          is_free: noticeForm.is_free,
          is_urgent: noticeForm.is_urgent,
        });
        queryClient.invalidateQueries({ queryKey: ["notices"] });
      } else if (listingType === "event") {
        await createEvent({
          listing: listing.id,
          category: eventForm.category,
          event_date: eventForm.event_date,
          event_end_date: eventForm.event_end_date || null,
          venue: eventForm.venue,
          organiser: eventForm.organiser,
          is_free: eventForm.is_free,
          ticket_price: eventForm.ticket_price || null,
          max_attendees: eventForm.max_attendees || null,
          is_online: eventForm.is_online,
          event_url: eventForm.event_url,
        });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["home-events"] });
      }

      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["home-featured"] });
      setCreatedListingId(listing.id);
      setCreatedListingSlug(listing.slug);
      setStep(4);
      addToast("Listing created! Now add some photos.", "success");
    } catch (err) {
      if (baseListingSlug) {
        try {
          await deleteListing(baseListingSlug);
        } catch (e) {
          console.error("Rollback failed:", e);
        }
      }
      if (
        err.response?.status === 403 ||
        err.response?.data?.detail?.includes("suspended")
      ) {
        setError(
          "Your account has been suspended. Please contact support@nepsaathi.com",
        );
        return;
      }
      const errors = err.response?.data;
      if (errors) {
        const first = Object.values(errors)[0];
        setError(
          Array.isArray(first)
            ? first[0]
            : typeof first === "string"
              ? first
              : "Something went wrong.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageComplete = () => {
    const paths = {
      job: "jobs",
      room: "rooms",
      notice: "notices",
      event: "events",
    };
    navigate(`/${paths[listingType] || ""}/${createdListingSlug}`);
  };

  return (
    <>
      <style>{`
        .pa-grid2  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pa-grid3  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .pa-grid21 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        @media (max-width: 540px) {
          .pa-grid2  { grid-template-columns: 1fr !important; }
          .pa-grid3  { grid-template-columns: 1fr 1fr !important; }
          .pa-grid21 { grid-template-columns: 1fr !important; }
          .pa-hero   { padding: 16px 16px 14px !important; border-radius: 12px !important; }
          .pa-hero h1 { font-size: 18px !important; }
          .pa-hero p  { font-size: 12px !important; margin-bottom: 14px !important; }
          .pa-wrap   { padding: 12px !important; }
          .pa-card   { padding: 14px !important; border-radius: 12px !important; }
          .pa-type-icon { width: 36px !important; height: 36px !important; font-size: 18px !important; border-radius: 9px !important; }
          .pa-type-label { font-size: 13px !important; }
          .pa-type-desc  { font-size: 11px !important; }
          .pa-section-header { padding: 10px 14px !important; }
          .pa-section-body   { padding: 14px !important; }
          input, select, textarea { font-size: 16px !important; }
        }
      `}</style>

      <div
        className="pa-wrap"
        style={{
          maxWidth: "660px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Dark hero ── */}
        <div
          className="pa-hero"
          style={{
            background: "#26215C",
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#AFA9EC",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            FREE · ALWAYS
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 6px",
            }}
          >
            Post a free ad
          </h1>
          <p style={{ fontSize: "13px", color: "#AFA9EC", margin: "0 0 18px" }}>
            Reach thousands of Nepalese Australians instantly
          </p>

          {/* Step indicator — circles + connector lines only, label below */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {[1, 2, 3, 4].map((s) => {
              const done = step > s;
              const current = step === s;
              return (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: s < 4 ? 1 : "none",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: done
                        ? "#1D9E75"
                        : current
                          ? "#E87722"
                          : "rgba(255,255,255,0.15)",
                      color: done || current ? "#fff" : "#AFA9EC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {done ? "✓" : s}
                  </div>
                  {s < 4 && (
                    <div
                      style={{
                        flex: 1,
                        height: "2px",
                        background: done ? "#1D9E75" : "rgba(255,255,255,0.2)",
                        margin: "0 4px",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Current step label — single line below circles */}
          <div
            style={{
              fontSize: "11px",
              color: "#E87722",
              fontWeight: 700,
              marginTop: "8px",
              letterSpacing: "0.02em",
            }}
          >
            Step {step} — {STEP_LABELS[step - 1]}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#A32D2D",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ══ STEP 1 — Choose type ══ */}
        {step === 1 && (
          <div
            className="pa-card"
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#26215C",
                marginBottom: "14px",
              }}
            >
              What are you posting?
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              {LISTING_TYPES.map((item) => (
                <div
                  key={item.value}
                  onClick={() => {
                    setListingType(item.value);
                    setError("");
                  }}
                  style={{
                    border:
                      listingType === item.value
                        ? `1.5px solid ${item.border}`
                        : "0.5px solid #e5e5e5",
                    background: listingType === item.value ? item.bg : "#fff",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    className="pa-type-icon"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: item.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                    }}
                  >
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="pa-type-label"
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#26215C",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="pa-type-desc"
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginTop: "2px",
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  {listingType === item.value && (
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: item.border,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <NavButtons
              onNext={() => {
                if (!listingType) {
                  setError("Please select a listing type.");
                  return;
                }
                setError("");
                setStep(2);
              }}
              nextLabel="Continue →"
              nextColor="#534AB7"
            />
          </div>
        )}

        {/* ══ STEP 2 — Basic details ══ */}
        {step === 2 && (
          <>
            {/* Wanted toggle for job/room */}
            {(listingType === "job" || listingType === "room") && (
              <div style={{ marginBottom: "12px" }}>
                <WantedToggle
                  isWanted={baseForm.is_wanted}
                  listingType={listingType}
                  onChange={() =>
                    setBaseForm((p) => ({ ...p, is_wanted: !p.is_wanted }))
                  }
                />
              </div>
            )}

            <SectionCard
              title="Listing details"
              accent="#26215C"
              accentBg="#EEEDFE"
              accentBorder="#AFA9EC"
            >
              {listingType === "notice" && (
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    style={inputStyle}
                    value={noticeForm.category}
                    onChange={setAnn("category")}
                  >
                    <option value="news">📰 Community news</option>
                    <option value="sale">🏷️ Item for sale</option>
                    <option value="service">🛠️ Service offered</option>
                    <option value="lost_found">🔎 Lost and found</option>
                    <option value="education">📚 Education</option>
                    <option value="general">📢 General</option>
                  </select>
                </div>
              )}
              {listingType === "event" && (
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    style={inputStyle}
                    value={eventForm.category}
                    onChange={setEvt("category")}
                  >
                    <option value="cultural">🎭 Cultural</option>
                    <option value="sports">⚽ Sports</option>
                    <option value="food">🍛 Food and Dining</option>
                    <option value="music">🎵 Music and Entertainment</option>
                    <option value="religious">🙏 Religious</option>
                    <option value="community">👥 Community Meetup</option>
                    <option value="education">📚 Education and Workshop</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  style={inputStyle}
                  value={baseForm.title}
                  placeholder={
                    baseForm.is_wanted && listingType === "job"
                      ? "e.g. Looking for kitchen hand job in Sydney"
                      : baseForm.is_wanted && listingType === "room"
                        ? "e.g. Looking for 1 bedroom in Parramatta"
                        : listingType === "job"
                          ? "e.g. Kitchen Hand Wanted"
                          : listingType === "room"
                            ? "e.g. Private room in Parramatta"
                            : listingType === "notice"
                              ? "e.g. Selling furniture — dining table and chairs"
                              : listingType === "event"
                                ? "e.g. Dashain Celebration 2025"
                                : "e.g. Community notice"
                  }
                  onChange={setBase("title")}
                />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Description *</label>
                  <button
                    type="button"
                    onClick={handleAiImprove}
                    disabled={!baseForm.description.trim() || aiState.loading}
                    title="Rewrite your description using AI"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: !baseForm.description.trim() || aiState.loading ? "not-allowed" : "pointer",
                      opacity: !baseForm.description.trim() || aiState.loading ? 0.6 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {aiState.loading ? "Improving..." : "✨ Improve with AI"}
                  </button>
                </div>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                  value={baseForm.description}
                  placeholder={
                    baseForm.is_wanted && listingType === "job"
                      ? "Tell employers about yourself and what work you're looking for..."
                      : baseForm.is_wanted && listingType === "room"
                        ? "Tell landlords about yourself and what you're looking for..."
                        : "Describe your listing in detail..."
                  }
                  onChange={(e) => {
                    setBase("description")(e);
                    if (aiState.preview || aiState.error) setAiState({ loading: false, preview: null, error: null });
                  }}
                />
                {aiState.error && (
                  <p style={{ fontSize: 11, color: "#A32D2D", margin: "4px 0 0" }}>{aiState.error}</p>
                )}
                {aiState.preview && (
                  <div style={{
                    marginTop: 8,
                    border: "1px solid #c4b5fd",
                    borderRadius: 8,
                    background: "#faf5ff",
                    padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      ✨ AI suggestion
                    </div>
                    <p style={{ fontSize: 13, color: "#3b1f6e", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                      {aiState.preview}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBaseForm(p => ({ ...p, description: aiState.preview }));
                          setAiState({ loading: false, preview: null, error: null });
                        }}
                        style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Use this
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiState({ loading: false, preview: null, error: null })}
                        style={{ background: "#f3f4f6", color: "#555", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Grid2>
                <div>
                  <label style={labelStyle}>Suburb / City *</label>
                  <AddressAutocomplete
                    value={baseForm.location}
                    onChange={(val) => setBaseForm(p => ({ ...p, location: val }))}
                    onSelect={({ suburb, state, postcode }) => setBaseForm(p => ({
                      ...p,
                      location: suburb,
                      ...(state && { state }),
                      ...(postcode && { postcode }),
                    }))}
                    placeholder="e.g. Parramatta"
                    inputStyle={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Postcode</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 2150"
                    value={baseForm.postcode}
                    onChange={setBase("postcode")}
                    maxLength={10}
                  />
                </div>
              </Grid2>
              <div>
                <label style={labelStyle}>State *</label>
                <select
                  style={inputStyle}
                  value={baseForm.state}
                  onChange={setBase("state")}
                >
                  {STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </SectionCard>

            <SectionCard
              title="Contact details"
              accent="#633806"
              accentBg="#FFF1E0"
              accentBorder="#EFD9C0"
            >
              <div
                style={{
                  background: "#FFF1E0",
                  border: "0.5px solid #EFD9C0",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#633806",
                }}
              >
                💡 Only shown to logged-in NepSaathi members
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 0412 345 678"
                  value={baseForm.contact_phone}
                  onChange={setBase("contact_phone")}
                />
              </div>
              <Grid2>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 0412 345 678"
                    value={baseForm.contact_whatsapp}
                    onChange={setBase("contact_whatsapp")}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    style={inputStyle}
                    placeholder="e.g. hello@example.com"
                    value={baseForm.contact_email}
                    onChange={setBase("contact_email")}
                  />
                </div>
              </Grid2>
            </SectionCard>

            <NavButtons
              onBack={() => {
                setError("");
                setStep(1);
              }}
              onNext={() => {
                if (
                  !baseForm.title ||
                  !baseForm.description ||
                  !baseForm.location
                ) {
                  setError("Please fill in title, description and location.");
                  return;
                }
                setError("");
                setStep(3);
              }}
              nextLabel="Continue →"
              nextColor="#534AB7"
            />
          </>
        )}

        {/* ══ STEP 3 — Job details ══ */}
        {step === 3 && listingType === "job" && (
          <>
            {baseForm.is_wanted && (
              <div
                style={{
                  background: "#EEEDFE",
                  border: "0.5px solid #AFA9EC",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#3C3489",
                  fontWeight: 500,
                  marginBottom: "12px",
                }}
              >
                🔍 You're posting as a job seeker — fill in your details and
                what you're looking for.
              </div>
            )}

            <SectionCard
              title="Job details"
              accent="#3C3489"
              accentBg="#EEEDFE"
              accentBorder="#AFA9EC"
            >
              {!baseForm.is_wanted && (
                <div>
                  <label style={labelStyle}>Company name</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Himalayan Cafe"
                    value={jobForm.company_name}
                    onChange={setJob("company_name")}
                  />
                </div>
              )}
              <Grid2>
                <div>
                  <label style={labelStyle}>
                    {baseForm.is_wanted ? "Type of work" : "Job type *"}
                  </label>
                  <select
                    style={inputStyle}
                    value={jobForm.job_type}
                    onChange={setJob("job_type")}
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    {baseForm.is_wanted ? "Expected pay" : "Pay type"}
                  </label>
                  <select
                    style={inputStyle}
                    value={jobForm.salary_type}
                    onChange={setJob("salary_type")}
                  >
                    {SALARY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Grid2>
              <div>
                <label style={labelStyle}>
                  {baseForm.is_wanted
                    ? "Expected salary (AUD)"
                    : "Salary (AUD)"}
                </label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="e.g. 23.50"
                  value={jobForm.salary}
                  onChange={setJob("salary")}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  {baseForm.is_wanted ? "My experience" : "Experience required"}
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 1 year kitchen experience"
                  value={jobForm.experience_required}
                  onChange={setJob("experience_required")}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  {baseForm.is_wanted ? "My qualifications" : "Qualifications"}
                </label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="e.g. Food handler certificate, RSA certified"
                  value={jobForm.qualifications}
                  onChange={setJob("qualifications")}
                />
              </div>
              {!baseForm.is_wanted && (
                <CheckCard
                  checked={jobForm.is_urgent}
                  onChange={(e) =>
                    setJobForm((p) => ({ ...p, is_urgent: e.target.checked }))
                  }
                  label="🔴 Mark as urgent"
                  sublabel="Adds an urgent badge to your listing"
                  color="#A32D2D"
                  bg="#FCEBEB"
                  border="#F09595"
                />
              )}
            </SectionCard>

            <NavButtons
              onBack={() => {
                setError("");
                setStep(2);
              }}
              onNext={handleSubmit}
              loading={loading}
              nextLabel={
                baseForm.is_wanted ? "Post job wanted →" : "Post job →"
              }
            />
          </>
        )}

        {/* ══ STEP 3 — Room details ══ */}
        {step === 3 && listingType === "room" && (
          <>
            {baseForm.is_wanted && (
              <div
                style={{
                  background: "#FFF1E0",
                  border: "0.5px solid #EFD9C0",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#633806",
                  fontWeight: 500,
                  marginBottom: "12px",
                }}
              >
                🏘️ You're posting as a room seeker — fill in what you're looking
                for.
              </div>
            )}

            <SectionCard
              title="Room details"
              accent="#633806"
              accentBg="#FFF1E0"
              accentBorder="#EFD9C0"
            >
              <Grid2>
                <div>
                  <label style={labelStyle}>
                    {baseForm.is_wanted ? "Room type needed" : "Room type *"}
                  </label>
                  <select
                    style={inputStyle}
                    value={roomForm.room_type}
                    onChange={setRoom("room_type")}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Furnishing</label>
                  <select
                    style={inputStyle}
                    value={roomForm.furnishing}
                    onChange={setRoom("furnishing")}
                  >
                    {FURNISHINGS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Grid2>
              <Grid2>
                <div>
                  <label style={labelStyle}>
                    {baseForm.is_wanted
                      ? "Max budget/wk (AUD)"
                      : "Weekly rent (AUD) *"}
                  </label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="e.g. 250"
                    value={roomForm.price}
                    onChange={setRoom("price")}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    {baseForm.is_wanted ? "Move in date" : "Available from"}
                  </label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={roomForm.available_from}
                    onChange={setRoom("available_from")}
                  />
                </div>
              </Grid2>
              {!baseForm.is_wanted && (
                <>
                  <div>
                    <label style={labelStyle}>Bond required</label>
                    <select
                      style={inputStyle}
                      value={roomForm.bond}
                      onChange={setRoom("bond")}
                    >
                      <option value="2_weeks">2 weeks</option>
                      <option value="4_weeks">4 weeks</option>
                      <option value="6_weeks">6 weeks</option>
                      <option value="negotiable">Negotiable</option>
                    </select>
                  </div>
                  <div className="pa-grid3">
                    <div>
                      <label style={labelStyle}>Bedrooms</label>
                      <input
                        type="number"
                        min="1"
                        style={inputStyle}
                        value={roomForm.bedrooms}
                        onChange={setRoom("bedrooms")}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Bathrooms</label>
                      <input
                        type="number"
                        min="1"
                        style={inputStyle}
                        value={roomForm.bathrooms}
                        onChange={setRoom("bathrooms")}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Max occupants</label>
                      <input
                        type="number"
                        min="1"
                        style={inputStyle}
                        value={roomForm.max_occupants}
                        onChange={setRoom("max_occupants")}
                      />
                    </div>
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard
              title="Features"
              accent="#085041"
              accentBg="#E1F5EE"
              accentBorder="#9FE1CB"
            >
              <CheckCard
                checked={roomForm.bills_included}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    bills_included: e.target.checked,
                  }))
                }
                label="💡 Bills included"
                sublabel={
                  baseForm.is_wanted
                    ? "I prefer bills included"
                    : "Electricity, water, internet included"
                }
                color="#085041"
                bg="#E1F5EE"
                border="#9FE1CB"
              />
              <CheckCard
                checked={roomForm.nepalese_household}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    nepalese_household: e.target.checked,
                  }))
                }
                label="🇳🇵 Nepalese household"
                sublabel="The household is Nepalese"
                color="#534AB7"
                bg="#EEEDFE"
                border="#AFA9EC"
              />
              <CheckCard
                checked={roomForm.pets_allowed}
                onChange={(e) =>
                  setRoomForm((p) => ({ ...p, pets_allowed: e.target.checked }))
                }
                label="🐾 Pets"
                sublabel={
                  baseForm.is_wanted ? "I have pets" : "Pets are welcome"
                }
                color="#633806"
                bg="#FFF1E0"
                border="#EFD9C0"
              />
              <CheckCard
                checked={roomForm.parking_available}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    parking_available: e.target.checked,
                  }))
                }
                label="🚗 Parking"
                sublabel={
                  baseForm.is_wanted ? "I need parking" : "Parking is available"
                }
                color="#444"
                bg="#F5F4F0"
                border="#e5e5e5"
              />
            </SectionCard>

            {!baseForm.is_wanted && (
              <SectionCard
                title="Property address"
                accent="#1A6B3C"
                accentBg="#E8F5EE"
                accentBorder="#B6DCC7"
              >
                <div
                  style={{
                    background: "#E8F5EE",
                    border: "0.5px solid #B6DCC7",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "#1A6B3C",
                  }}
                >
                  💡 Street address helps renters find the property. Leave blank
                  if you prefer to share it privately.
                </div>
                <div>
                  <label style={labelStyle}>Street address</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 12/34 Main St"
                    value={roomForm.street_address}
                    onChange={setRoom("street_address")}
                  />
                </div>
              </SectionCard>
            )}

            <NavButtons
              onBack={() => {
                setError("");
                setStep(2);
              }}
              onNext={handleSubmit}
              loading={loading}
              nextLabel={
                baseForm.is_wanted ? "Post room wanted →" : "Post room →"
              }
            />
          </>
        )}

        {/* ══ STEP 3 — Notice details ══ */}
        {step === 3 && listingType === "notice" && (
          <>
            <SectionCard
              title="Notice details"
              accent="#0C447C"
              accentBg="#E6F1FB"
              accentBorder="#B5D4F4"
            >
              <Grid2>
                <div>
                  <label style={labelStyle}>Price (AUD)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="e.g. 50"
                    value={noticeForm.price}
                    onChange={setAnn("price")}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Condition</label>
                  <select
                    style={inputStyle}
                    value={noticeForm.condition}
                    onChange={setAnn("condition")}
                  >
                    <option value="na">Not applicable</option>
                    <option value="new">Brand new</option>
                    <option value="like_new">Like new</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </Grid2>
              <CheckCard
                checked={noticeForm.is_free}
                onChange={(e) =>
                  setNoticeForm((p) => ({
                    ...p,
                    is_free: e.target.checked,
                  }))
                }
                label="🎁 This is free"
                sublabel="Marks this listing as a free item or service"
                color="#085041"
                bg="#E1F5EE"
                border="#9FE1CB"
              />
              <CheckCard
                checked={noticeForm.is_urgent}
                onChange={(e) =>
                  setNoticeForm((p) => ({
                    ...p,
                    is_urgent: e.target.checked,
                  }))
                }
                label="🔴 Mark as urgent"
                sublabel="Adds an urgent badge to your listing"
                color="#A32D2D"
                bg="#FCEBEB"
                border="#F09595"
              />
            </SectionCard>

            <NavButtons
              onBack={() => {
                setError("");
                setStep(2);
              }}
              onNext={handleSubmit}
              loading={loading}
              nextLabel="Post notice →"
            />
          </>
        )}

        {/* ══ STEP 3 — Event details ══ */}
        {step === 3 && listingType === "event" && (
          <>
            <SectionCard
              title="Event details"
              accent="#085041"
              accentBg="#E1F5EE"
              accentBorder="#9FE1CB"
            >
              <Grid2>
                <div>
                  <label style={labelStyle}>Event date and time *</label>
                  <input
                    type="datetime-local"
                    style={inputStyle}
                    value={eventForm.event_date}
                    onChange={setEvt("event_date")}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End date and time</label>
                  <input
                    type="datetime-local"
                    style={inputStyle}
                    value={eventForm.event_end_date}
                    onChange={setEvt("event_end_date")}
                  />
                </div>
              </Grid2>
              <div>
                <label style={labelStyle}>Venue / Address</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Parramatta Town Hall"
                  value={eventForm.venue}
                  onChange={setEvt("venue")}
                />
              </div>
              <div>
                <label style={labelStyle}>Organiser</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Nepalese Community Association"
                  value={eventForm.organiser}
                  onChange={setEvt("organiser")}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Tickets"
              accent="#633806"
              accentBg="#FFF1E0"
              accentBorder="#EFD9C0"
            >
              <CheckCard
                checked={eventForm.is_free}
                onChange={(e) =>
                  setEventForm((p) => ({ ...p, is_free: e.target.checked }))
                }
                label="🎟️ Free event"
                sublabel="No ticket price required"
                color="#085041"
                bg="#E1F5EE"
                border="#9FE1CB"
              />
              <CheckCard
                checked={eventForm.is_online}
                onChange={(e) =>
                  setEventForm((p) => ({ ...p, is_online: e.target.checked }))
                }
                label="💻 Online / virtual event"
                sublabel="This event takes place online"
                color="#0C447C"
                bg="#E6F1FB"
                border="#B5D4F4"
              />
              <Grid2>
                <div>
                  <label style={labelStyle}>Ticket price (AUD)</label>
                  <input
                    type="number"
                    style={{
                      ...inputStyle,
                      opacity: eventForm.is_free ? 0.5 : 1,
                    }}
                    placeholder="e.g. 20"
                    value={eventForm.ticket_price}
                    disabled={eventForm.is_free}
                    onChange={setEvt("ticket_price")}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Max attendees</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="e.g. 100"
                    value={eventForm.max_attendees}
                    onChange={setEvt("max_attendees")}
                  />
                </div>
              </Grid2>
              <div>
                <label style={labelStyle}>Event URL</label>
                <input
                  type="url"
                  style={inputStyle}
                  placeholder="e.g. https://eventbrite.com/..."
                  value={eventForm.event_url}
                  onChange={setEvt("event_url")}
                />
              </div>
            </SectionCard>

            <NavButtons
              onBack={() => {
                setError("");
                setStep(2);
              }}
              onNext={() => {
                if (!eventForm.event_date) {
                  setError("Please set an event date.");
                  return;
                }
                if (new Date(eventForm.event_date) < new Date()) {
                  setError("Event date must be in the future.");
                  return;
                }
                handleSubmit();
              }}
              loading={loading}
              nextLabel="Post event →"
            />
          </>
        )}

        {/* ══ STEP 4 — Photos ══ */}
        {step === 4 && createdListingId && (
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "#26215C", padding: "14px 20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                Add photos
              </div>
              <div
                style={{ fontSize: "12px", color: "#AFA9EC", marginTop: "2px" }}
              >
                Photos help your listing stand out — you can skip this step
              </div>
            </div>
            <div style={{ padding: "20px" }}>
              <ImageUpload
                listingId={createdListingId}
                onComplete={handleImageComplete}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
