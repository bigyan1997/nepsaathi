import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../../api/jobs";
import { useNavigate, useLocation } from "react-router-dom";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";

const JOB_TYPES = [
  { value: "", label: "All types" },
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "casual", label: "Casual" },
  { value: "contract", label: "Contract" },
];

const STATES = [
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
export default function JobsPage() {
  usePageTitle("Jobs in Australia");
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState({
    job_type: "",
    search: "",
    state: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", filters],
    queryFn: () =>
      getJobs({
        job_type: filters.job_type || undefined,
        search: filters.search || undefined,
        listing__state: filters.state || undefined,
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

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "6px",
          }}
        >
          Job listings
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Find Nepalese-friendly jobs across Australia
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search jobs..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            flex: 1,
            minWidth: "200px",
            border: "0.5px solid #ccc",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
            outline: "none",
            background: "#fff",
          }}
        />
        <select
          value={filters.job_type}
          onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
          style={{
            border: "0.5px solid #ccc",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
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
            border: "0.5px solid #ccc",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
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
      </div>

      {/* Results */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FCEBEB",
            border: "0.5px solid #F09595",
            borderRadius: "8px",
            padding: "14px",
            color: "#A32D2D",
            fontSize: "14px",
          }}
        >
          Failed to load jobs. Please try again.
        </div>
      )}

      {data && data.results?.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          No jobs found. Try a different search.
        </div>
      )}

      {/* Job cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data?.results?.map((job) => (
          <div
            key={job.id}
            onClick={() => navigate(`/jobs/${job.id}`)}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "12px",
              padding: "18px 20px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#AFA9EC")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#e5e5e5")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                {/* Urgent badge */}
                {job.is_urgent && (
                  <span
                    style={{
                      background: "#FCEBEB",
                      color: "#A32D2D",
                      fontSize: "10px",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "8px",
                      marginBottom: "6px",
                      display: "inline-block",
                    }}
                  >
                    Urgent
                  </span>
                )}
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#26215C",
                    marginBottom: "4px",
                  }}
                >
                  {job.listing_title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  {job.company_name} · {job.listing_location},{" "}
                  {job.listing_state}
                </p>
              </div>
              {/* Salary */}
              <div
                style={{
                  background: "#EEEDFE",
                  color: "#3C3489",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {job.salary_display}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  background: "#EEEDFE",
                  color: "#534AB7",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "10px",
                }}
              >
                {job.job_type?.replace("_", " ")}
              </span>
              <span
                style={{ fontSize: "11px", color: "#aaa", alignSelf: "center" }}
              >
                Posted by {job.posted_by}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
