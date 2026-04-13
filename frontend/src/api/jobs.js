import api from "../utils/axios";

// Fetch all active job listings with optional filters
// Example: getJobs({ job_type: 'casual', is_urgent: true })
export const getJobs = async (params = {}) => {
  const response = await api.get("/api/jobs/", { params });
  return response.data;
};

// Get a single job by ID
export const getJob = async (id) => {
  const response = await api.get(`/api/jobs/${id}/`);
  return response.data;
};

// Create job details attached to a listing
export const createJob = async (data) => {
  const response = await api.post("/api/jobs/create/", data);
  return response.data;
};

// Update job details (owner only)
export const updateJob = async (id, data) => {
  const response = await api.patch(`/api/jobs/${id}/`, data);
  return response.data;
};
