import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../../api/jobs";
import { SkeletonJobCard } from "../../components/ui/Skeleton";
import usePageMeta from "../../hooks/usePageMeta";
import { STATES } from "../../utils/constants";
import SaveSearchButton from "../../components/ui/SaveSearchButton";

const JOB_TYPES = [
  { value: "", label: "All types" },
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "casual", label: "Casual" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const TABS = [
  { value: "", label: "All Jobs", emoji: "💼" },
  { value: "false", label: "Hiring", emoji: "🏢" },
  { value: "true", label: "Job Seekers", emoji: "🔍" },
];

const SORT_OPTIONS = [
  {
    value: "-listing__is_featured,-listing__created_at",
    label: "Featured first",
  },
  { value: "-listing__created_at", label: "Newest first" },
  { value: "listing__created_at", label: "Oldest first" },
  { value: "salary", label: "Salary ↑" },
  { value: "-salary", label: "Salary ↓" },
];

function isNew(dateStr) {
  return dateStr && Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const w = Math.floor(days / 7);
  if (w === 1) return "1 week ago";
  if (w < 5) return `${w} weeks ago`;
  const m = Math.floor(days / 30);
  return m === 1 ? "1 month ago" : `${m} months ago`;
}

/* ── Mobile filter drawer ────────────────────────── */
function MobileFilterDrawer({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState({ ...filters });
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const sel = {
    width: "100%",
    border: "0.5px solid #ddd",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "16px",
    background: "#F5F4F0",
    color: "#444",
    outline: "none",
    boxSizing: "border-box",
  };
  const lbl = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          zIndex: 101,
          maxHeight: "88vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 0",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "#e5e5e5",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "0.5px solid #f0f0f0",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#26215C" }}>
            Filters
          </div>
          <button
            onClick={() =>
              setDraft((p) => ({
                ...p,
                job_type: "",
                state: "",
                ordering: "-listing__is_featured,-listing__created_at",
                min_salary: "",
                max_salary: "",
                is_urgent: "",
              }))
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#534AB7",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        </div>
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <div style={lbl}>Job type</div>
            <select
              value={draft.job_type}
              onChange={(e) => set("job_type", e.target.value)}
              style={sel}
            >
              {JOB_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={lbl}>State</div>
            <select
              value={draft.state}
              onChange={(e) => set("state", e.target.value)}
              style={sel}
            >
              {STATES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={lbl}>Salary range (AUD)</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="number"
                placeholder="Min"
                value={draft.min_salary}
                onChange={(e) => set("min_salary", e.target.value)}
                style={{ ...sel, width: "50%" }}
                min="0"
              />
              <input
                type="number"
                placeholder="Max"
                value={draft.max_salary}
                onChange={(e) => set("max_salary", e.target.value)}
                style={{ ...sel, width: "50%" }}
                min="0"
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={draft.is_urgent === "true"}
                onChange={(e) =>
                  set("is_urgent", e.target.checked ? "true" : "")
                }
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#444" }}>
                🔥 Urgent jobs only
              </span>
            </label>
          </div>
          <div>
            <div style={lbl}>Sort by</div>
            <select
              value={draft.ordering}
              onChange={(e) => set("ordering", e.target.value)}
              style={sel}
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            style={{
              width: "100%",
              background: "#534AB7",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Mobile card — Option B ───────────────────────── */
function JobMobileCard({ job }) {
  const isWanted = job.is_wanted;
  const headerBg = isWanted ? "#EEEDFE" : "#F0EFF9";
  return (
    <Link
      to={`/jobs/${job.listing_slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
        textDecoration: "none",
        transition: "box-shadow 0.15s",
        height: "100%",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(83,74,183,0.12)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      onTouchStart={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(83,74,183,0.12)")
      }
      onTouchEnd={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Strip */}
      <div
        style={{
          background: headerBg,
          height: "130px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "36px" }}>{isWanted ? "🔍" : "💼"}</span>

        {/* Salary — top right */}
        <div
          style={{ position: "absolute", top: "8px", right: "8px", zIndex: 2 }}
        >
          <span
            style={{
              background: "rgba(255,255,255,0.95)",
              color: "#3C3489",
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {job.salary_display}
          </span>
        </div>

        {/* Badges — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            zIndex: 2,
          }}
        >
          {job.is_featured && (
            <span
              style={{
                background: "linear-gradient(135deg,#E87722,#534AB7)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "5px",
                alignSelf: "flex-start",
              }}
            >
              ⭐ Featured
            </span>
          )}
          {isNew(job.created_at) && (
            <span style={{ background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", alignSelf: "flex-start" }}>
              NEW
            </span>
          )}
          {isWanted && (
            <span
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#534AB7",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "5px",
                alignSelf: "flex-start",
              }}
            >
              🔍 Seeker
            </span>
          )}
          {job.is_urgent && !isWanted && (
            <span
              style={{
                background: "#FCEBEB",
                color: "#A32D2D",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "5px",
                alignSelf: "flex-start",
              }}
            >
              🔴 Urgent
            </span>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "#534AB7",
            opacity: 0.4,
          }}
        />
      </div>

      {/* Body */}
      <div
        style={{
          padding: "10px 12px 12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div style={{ fontSize: "10px", color: "#534AB7", fontWeight: 600 }}>
          {timeAgo(job.created_at || job.date_posted)}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {job.listing_title}
        </div>
        {job.company_name && (
          <div
            style={{
              fontSize: "11px",
              color: "#555",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {job.company_name}
          </div>
        )}
        <div
          style={{
            fontSize: "11px",
            color: "#777",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📍 {job.listing_location}, {job.listing_state}
        </div>
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
        >
          {job.job_type && (
            <span
              style={{
                background: "#EEEDFE",
                color: "#3C3489",
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "6px",
              }}
            >
              {job.job_type.replace("_", " ")}
            </span>
          )}
          {isWanted && (
            <span
              style={{
                background: "#F0EFF9",
                color: "#534AB7",
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "6px",
              }}
            >
              Seeking
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Desktop card ─────────────────────────────────── */
function JobCard({ job }) {
  const [hovered, setHovered] = useState(false);
  const isWanted = job.is_wanted;
  return (
    <Link
      to={`/jobs/${job.listing_slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        border: `0.5px solid ${hovered ? "#AFA9EC" : "#e5e5e5"}`,
        boxShadow: hovered
          ? "0 8px 28px rgba(83,74,183,0.13)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.2s",
        minHeight: "300px",
      }}
    >
      <div
        style={{
          background: isWanted ? "#EEEDFE" : "#F0EFF9",
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "44px",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {isWanted ? "🔍" : "💼"}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
          }}
        >
          {job.is_featured && (
            <span
              style={{
                background: "linear-gradient(135deg,#E87722,#534AB7)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
              }}
            >
              ⭐ FEATURED
            </span>
          )}
          {isNew(job.created_at) && (
            <span style={{ background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", alignSelf: "flex-start" }}>
              NEW
            </span>
          )}
          {isWanted && (
            <span
              style={{
                background: "#EEEDFE",
                color: "#534AB7",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
              }}
            >
              🔍 SEEKING
            </span>
          )}
          {job.is_urgent && !isWanted && (
            <span
              style={{
                background: "#FCEBEB",
                color: "#A32D2D",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
              }}
            >
              🔴 URGENT
            </span>
          )}
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
          <span
            style={{
              background: "#EEEDFE",
              color: "#3C3489",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            {job.salary_display}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "#534AB7",
            opacity: 0.3,
          }}
        />
      </div>
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#534AB7" }}>
          {timeAgo(job.created_at || job.date_posted)}
        </div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#26215C",
            lineHeight: 1.25,
          }}
        >
          {job.listing_title}
        </div>
        {!isWanted && job.company_name && (
          <div style={{ fontSize: "12px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.company_name}
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          📍 {job.listing_location}, {job.listing_state}
        </div>
        {job.description && (
          <div
            style={{
              fontSize: "12px",
              color: "#555",
              lineHeight: 1.5,
              marginTop: "4px",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {job.description}
          </div>
        )}
      </div>
      <div
        style={{
          background: "#534AB7",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {[
          { value: job.job_type?.replace("_", " ") || "—", label: "Type" },
          { value: job.listing_state || "—", label: "State" },
          { value: isWanted ? "Seeking" : "Hiring", label: "Status" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════ */
export default function JobsPage() {
  usePageMeta("Nepali Jobs in Australia", "Browse full-time, part-time and casual jobs posted by the Nepalese community in Australia. Find your next opportunity on NepSaathi.");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState({
    job_type: "",
    search: "",
    state: "",
    ordering: "-listing__is_featured,-listing__created_at",
    min_salary: "",
    max_salary: "",
    is_urgent: "",
  });
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const prevKey = useRef(null);

  const updateFilters = (u) => {
    setPage(1);
    setFilters((p) => ({ ...p, ...u }));
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["jobs", filters, page],
    queryFn: () =>
      getJobs({
        job_type: filters.job_type || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
        ordering: filters.ordering || undefined,
        min_salary: filters.min_salary || undefined,
        max_salary: filters.max_salary || undefined,
        is_urgent: filters.is_urgent || undefined,
        page,
      }),
  });

  useEffect(() => {
    if (!data?.results) return;
    const key = JSON.stringify(filters);
    if (key !== prevKey.current || page === 1) {
      setAllResults(data.results);
      prevKey.current = key;
    } else setAllResults((p) => [...p, ...data.results]);
  }, [data]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("search"),
      st = params.get("state");
    if (s || st) {
      setPage(1);
      setFilters((p) => ({ ...p, search: s || "", state: st || "" }));
    }
  }, [location.search]);

  const filteredResults = allResults.filter((j) => {
    if (activeTab === "true") return j.is_wanted === true;
    if (activeTab === "false") return j.is_wanted === false;
    return true;
  });

  const activeFilterCount = [
    filters.job_type,
    filters.state,
    filters.min_salary,
    filters.max_salary,
    filters.is_urgent,
    filters.ordering !== "-listing__is_featured,-listing__created_at" ? "1" : "",
  ].filter(Boolean).length;

  const activeChips = [
    filters.job_type && {
      key: "job_type",
      label: JOB_TYPES.find((t) => t.value === filters.job_type)?.label,
      color: "#3C3489",
      bg: "#EEEDFE",
      border: "#AFA9EC",
    },
    filters.state && {
      key: "state",
      label: filters.state,
      color: "#3C3489",
      bg: "#EEEDFE",
      border: "#AFA9EC",
    },
  ].filter(Boolean);

  const moreFilterCount = ["is_urgent"].filter((k) => filters[k] === "true").length;

  return (
    <>
      <style>{`
        .jb-desktop { display: none !important; }
        .jb-mobile  { display: grid !important; }
        .jb-fdesk   { display: none !important; }
        .jb-fmob    { display: flex !important; }
        .jb-tabs::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .jb-mobile  { display: none !important; }
          .jb-desktop { display: grid !important; }
          .jb-fmob    { display: none !important; }
          .jb-fdesk   { display: flex !important; }
        }
      `}</style>

      {drawerOpen && (
        <MobileFilterDrawer
          filters={filters}
          onApply={(d) => {
            setPage(1);
            setFilters(d);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "20px 16px 28px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#26215C",
              marginBottom: "4px",
            }}
          >
            Job listings
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Find Nepalese-friendly jobs across Australia
          </p>
        </div>

        {/* Tabs */}
        <div
          className="jb-tabs"
          style={{
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
            {TABS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => {
                  setActiveTab(value);
                  setPage(1);
                }}
                style={{
                  background: activeTab === value ? "#534AB7" : "#fff",
                  color: activeTab === value ? "#fff" : "#534AB7",
                  border: `1.5px solid ${activeTab === value ? "#534AB7" : "#AFA9EC"}`,
                  borderRadius: "20px",
                  padding: "7px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{emoji}</span>
                {label}
                {data && (
                  <span
                    style={{
                      background:
                        activeTab === value
                          ? "rgba(255,255,255,0.25)"
                          : "#EEEDFE",
                      color: activeTab === value ? "#fff" : "#534AB7",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {value === ""
                      ? (data?.count ?? allResults.length)
                      : value === "true"
                        ? allResults.filter((j) => j.is_wanted).length
                        : allResults.filter((j) => !j.is_wanted).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: search + filter */}
        <div className="jb-fmob" style={{ gap: "8px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="🔍  Search jobs..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            style={{
              flex: 1,
              minWidth: 0,
              border: "0.5px solid #ddd",
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "16px",
              outline: "none",
              background: "#fff",
            }}
          />
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: activeFilterCount > 0 ? "#EEEDFE" : "#fff",
              border: `0.5px solid ${activeFilterCount > 0 ? "#AFA9EC" : "#ddd"}`,
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: activeFilterCount > 0 ? "#534AB7" : "#555",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minWidth: "90px",
            }}
          >
            ⚙️ Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active chips (mobile) */}
        {activeChips.length > 0 && (
          <div
            className="jb-fmob"
            style={{ gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}
          >
            {activeChips.map(({ key, label, color, bg, border }) => (
              <button
                key={key}
                onClick={() => updateFilters({ [key]: "" })}
                style={{
                  background: bg,
                  border: `0.5px solid ${border}`,
                  color,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {label}{" "}
                <span style={{ opacity: 0.6, fontSize: "13px" }}>×</span>
              </button>
            ))}
            <button
              onClick={() =>
                updateFilters({
                  job_type: "",
                  state: "",
                  ordering: "-listing__is_featured,-listing__created_at",
                })
              }
              style={{
                background: "#FCEBEB",
                border: "0.5px solid #F09595",
                color: "#A32D2D",
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Mobile: count + save */}
        <div
          className="jb-fmob"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#888" }}>
            {data?.count != null
              ? `${data.count} result${data.count !== 1 ? "s" : ""} found`
              : ""}
          </span>
          <SaveSearchButton
            listingType="job"
            filters={{ search: filters.search, state: filters.state }}
          />
        </div>

        {/* Desktop filters */}
        <div
          className="jb-fdesk"
          style={{ gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="🔍  Search jobs..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            style={{
              flex: 1,
              minWidth: "180px",
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 14px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
            }}
          />
          <select
            value={filters.job_type}
            onChange={(e) => updateFilters({ job_type: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
              color: "#444",
            }}
          >
            {JOB_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.state}
            onChange={(e) => updateFilters({ state: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
              color: "#444",
            }}
          >
            {STATES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.ordering}
            onChange={(e) => updateFilters({ ordering: e.target.value })}
            style={{
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
              color: "#444",
            }}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min salary"
            value={filters.min_salary}
            onChange={(e) => updateFilters({ min_salary: e.target.value })}
            style={{
              width: "110px",
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
            }}
            min="0"
          />
          <input
            type="number"
            placeholder="Max salary"
            value={filters.max_salary}
            onChange={(e) => updateFilters({ max_salary: e.target.value })}
            style={{
              width: "110px",
              border: "0.5px solid #ddd",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "13px",
              outline: "none",
              background: "#fff",
            }}
            min="0"
          />
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            style={{
              border: `0.5px solid ${showMoreFilters ? "#AFA9EC" : "#ddd"}`,
              borderRadius: "8px",
              padding: "9px 14px",
              fontSize: "13px",
              background: showMoreFilters ? "#EEEDFE" : "#fff",
              color: showMoreFilters ? "#534AB7" : "#555",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {showMoreFilters ? "Fewer filters ▲" : "More filters ▼"}
            {moreFilterCount > 0 && !showMoreFilters && (
              <span style={{ background: "#534AB7", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 600 }}>
                {moreFilterCount}
              </span>
            )}
          </button>
          <SaveSearchButton
            listingType="job"
            filters={{ search: filters.search, state: filters.state }}
          />
        </div>
        {showMoreFilters && (
          <div
            className="jb-fdesk"
            style={{
              background: "#f9f9ff",
              border: "0.5px solid #e8e6f8",
              borderRadius: "10px",
              padding: "12px 16px",
              gap: "20px",
              marginBottom: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#444", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={filters.is_urgent === "true"}
                onChange={(e) => updateFilters({ is_urgent: e.target.checked ? "true" : "" })}
              />
              🔥 Urgent jobs only
            </label>
          </div>
        )}

        {(isLoading || (isFetching && allResults.length === 0)) && (
          <>
            <div
              className="jb-mobile"
              style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}
            >
              {[1, 2, 3, 4].map((i) => <SkeletonJobCard key={i} />)}
            </div>
            <div
              className="jb-desktop"
              style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonJobCard key={i} />)}
            </div>
          </>
        )}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "10px",
              padding: "14px",
              color: "#A32D2D",
              fontSize: "14px",
            }}
          >
            Failed to load jobs. Please try again.
          </div>
        )}
        {!isLoading && !isFetching && filteredResults.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "48px 20px", color: "#888" }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>
              {activeTab === "true" ? "🔍" : "💼"}
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#555",
                marginBottom: "6px",
              }}
            >
              No jobs found
            </p>
            <p style={{ fontSize: "13px" }}>Try a different search or filter</p>
          </div>
        )}

        {/* Mobile: 2-col card grid */}
        <div
          className="jb-mobile"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            opacity: isFetching && page === 1 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {filteredResults.map((job) => (
            <JobMobileCard key={job.id} job={job} />
          ))}
        </div>

        {/* Desktop: 3-col grid */}
        <div
          className="jb-desktop"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            opacity: isFetching && page === 1 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {filteredResults.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "24px" }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              style={{
                background: "#fff",
                border: "0.5px solid #AFA9EC",
                borderRadius: "8px",
                padding: "10px 28px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#534AB7",
                cursor: isFetching ? "not-allowed" : "pointer",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? "Loading…" : "Load more jobs"}
            </button>
            <p style={{ fontSize: "11px", color: "#aaa", marginTop: "8px" }}>
              Showing {allResults.length} of {data.count}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
