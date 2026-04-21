import { useState, useEffect } from "react";
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", filters, activeTab],
    queryFn: () =>
      getJobs({
        job_type: filters.job_type || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
        ordering: filters.ordering || undefined,
      }),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const stateParam = params.get("state");
    if (searchParam || stateParam) {
      setFilters((prev) => ({
        ...prev,
        search: searchParam || "",
        state: stateParam || "",
      }));
    }
  }, [location.search]);

  // Filter by tab on frontend
  const filteredResults = data?.results?.filter((job) => {
    if (activeTab === "") return true;
    if (activeTab === "true") return job.is_wanted === true;
    if (activeTab === "false") return job.is_wanted === false;
    return true;
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
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
            onClick={() => setActiveTab(value)}
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
                    activeTab === value ? "rgba(255,255,255,0.25)" : "#EEEDFE",
                  color: activeTab === value ? "#fff" : "#534AB7",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "10px",
                }}
              >
                {value === ""
                  ? data.results.length
                  : value === "true"
                    ? data.results.filter((j) => j.is_wanted).length
                    : data.results.filter((j) => !j.is_wanted).length}
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
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
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
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
      {!isLoading && filteredResults?.length === 0 && (
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

      {/* Job cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredResults?.map((job) => (
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
              {/* Left — icon + content */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Icon */}
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

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges */}
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
                            "linear-gradient(135deg, #E87722, #534AB7)",
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          letterSpacing: "0.03em",
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
                          letterSpacing: "0.03em",
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
                          letterSpacing: "0.03em",
                        }}
                      >
                        🔴 URGENT
                      </span>
                    )}
                  </div>

                  {/* Title */}
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

                  {/* Company / Location */}
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

                  {/* Tags */}
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

              {/* Right — salary */}
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

      {/* Pagination */}
      {data?.count > 20 && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#aaa",
            fontSize: "12px",
          }}
        >
          Showing {filteredResults?.length} of {data.count} jobs — refine your
          search for better results
        </div>
      )}
    </div>
  );
}
