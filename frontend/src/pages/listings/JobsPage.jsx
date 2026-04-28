import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../../api/jobs";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { STATES } from "../../utils/constants";

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

/* ── helpers ─────────────────────────────────────── */
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

/* ── Desktop card ────────────────────────────────── */
function JobCard({ job }) {
  const [hovered, setHovered] = useState(false);
  const isWanted = job.is_wanted;
  const accentColor = isWanted ? "#534AB7" : "#534AB7";
  const headerBg = isWanted ? "#EEEDFE" : "#F0EFF9";

  return (
    <Link
      to={`/jobs/listing/${job.listing_id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {/* Coloured header strip */}
      <div
        style={{
          background: headerBg,
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

        {/* Badges top-left */}
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

        {/* Salary badge top-right */}
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

        {/* bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: accentColor,
            opacity: 0.3,
          }}
        />
      </div>

      {/* Body */}
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {/* Timestamp */}
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#534AB7" }}>
          {timeAgo(job.created_at || job.date_posted)}
        </div>

        {/* Title */}
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

        {/* Company / location */}
        <div style={{ fontSize: "12px", color: "#777" }}>
          {isWanted
            ? `📍 ${job.listing_location}, ${job.listing_state}`
            : `${job.company_name ? `${job.company_name} · ` : ""}📍 ${job.listing_location}, ${job.listing_state}`}
        </div>

        {/* Description */}
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

      {/* Footer */}
      <div
        style={{
          background: accentColor,
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

/* ══════════════════════════════════════════════════ */
export default function JobsPage() {
  usePageTitle("Jobs in Australia");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");
  const [filters, setFilters] = useState({
    job_type: "",
    search: "",
    state: "",
    ordering: "-listing__created_at",
  });
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const prevKey = useRef(null);

  const updateFilters = (update) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["jobs", filters, page],
    queryFn: () =>
      getJobs({
        job_type: filters.job_type || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
        ordering: filters.ordering || undefined,
        page,
      }),
  });

  useEffect(() => {
    if (!data?.results) return;
    const key = JSON.stringify(filters);
    if (key !== prevKey.current || page === 1) {
      setAllResults(data.results);
      prevKey.current = key;
    } else {
      setAllResults((prev) => [...prev, ...data.results]);
    }
  }, [data]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const stateParam = params.get("state");
    if (searchParam || stateParam) {
      setPage(1);
      setFilters((prev) => ({
        ...prev,
        search: searchParam || "",
        state: stateParam || "",
      }));
    }
  }, [location.search]);

  const filteredResults = allResults.filter((job) => {
    if (activeTab === "") return true;
    if (activeTab === "true") return job.is_wanted === true;
    if (activeTab === "false") return job.is_wanted === false;
    return true;
  });

  return (
    <>
      <style>{`
        @media (max-width: 767px)  { .jobs-desktop { display: none !important; } .jobs-mobile { display: flex !important; } }
        @media (min-width: 768px)  { .jobs-mobile  { display: none !important; } .jobs-desktop { display: grid !important; } }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px" }}>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "26px",
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

        {/* Tab pills */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
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
              }}
            >
              <span>{emoji}</span>
              {label}
              {data?.results && (
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

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
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
            <option value="-listing__created_at">Newest first</option>
            <option value="listing__created_at">Oldest first</option>
            <option value="salary">Salary ↑</option>
            <option value="-salary">Salary ↓</option>
          </select>
        </div>

        {/* Loading */}
        {(isLoading || (isFetching && allResults.length === 0)) && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
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

        {/* Empty */}
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

        {/* ── Mobile: list rows ── */}
        <div
          className="jobs-mobile"
          style={{
            flexDirection: "column",
            gap: "10px",
            opacity: isFetching && page === 1 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {filteredResults.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/listing/${job.listing_id}`}
              style={{
                background: "#fff",
                border: `0.5px solid ${job.is_wanted ? "#AFA9EC" : "#e5e5e5"}`,
                borderRadius: "12px",
                padding: "16px 20px",
                textDecoration: "none",
                display: "block",
                transition: "all 0.15s",
                borderLeft: job.is_wanted
                  ? "3px solid #534AB7"
                  : job.is_featured
                    ? "3px solid #E87722"
                    : "0.5px solid #e5e5e5",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 12px rgba(83,74,183,0.1)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: job.is_wanted ? "#EEEDFE" : "#F5F4F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {job.is_wanted ? "🔍" : "💼"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        flexWrap: "wrap",
                        marginBottom: "5px",
                      }}
                    >
                      {job.is_featured && (
                        <span
                          style={{
                            background:
                              "linear-gradient(135deg,#E87722,#534AB7)",
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
                      {job.is_wanted && (
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
                          🔍 LOOKING FOR WORK
                        </span>
                      )}
                      {job.is_urgent && !job.is_wanted && (
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
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#26215C",
                        marginBottom: "3px",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.listing_title}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginBottom: "8px",
                      }}
                    >
                      {job.is_wanted
                        ? `📍 ${job.listing_location}, ${job.listing_state}`
                        : `${job.company_name ? `${job.company_name} · ` : ""}📍 ${job.listing_location}, ${job.listing_state}`}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          background: "#F0EFF9",
                          color: "#534AB7",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "2px 9px",
                          borderRadius: "8px",
                        }}
                      >
                        {job.job_type?.replace("_", " ")}
                      </span>
                      <span style={{ fontSize: "11px", color: "#bbb" }}>·</span>
                      <span style={{ fontSize: "11px", color: "#aaa" }}>
                        {job.is_wanted
                          ? `Seeking · ${job.posted_by}`
                          : `by ${job.posted_by}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div
                    style={{
                      background: "#EEEDFE",
                      color: "#3C3489",
                      fontSize: "13px",
                      fontWeight: 600,
                      padding: "5px 12px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.salary_display}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Desktop: card grid ── */}
        <div
          className="jobs-desktop"
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

        {/* Load more */}
        {data?.next && (
          <div style={{ textAlign: "center", paddingTop: "20px" }}>
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
