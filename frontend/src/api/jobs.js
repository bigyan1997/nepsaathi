import api from "../utils/axios";

// Fetch all active job listings with optional filters
export const getJobs = async (params = {}) => {
  const response = await api.get("/api/jobs/", { params });
  return response.data;
};

// Get a single job by ID
export const getJob = async (id) => {
  const response = await api.get(`/api/jobs/${id}/`);
  return response.data;
};

// Get a job by its parent listing slug
export const getJobByListing = async (listingSlug) => {
  const response = await api.get(`/api/jobs/listing/${listingSlug}/`);
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

// Delete job listing (owner only)
export const deleteJob = async (id) => {
  const response = await api.delete(`/api/jobs/${id}/`);
  return response.data;
};

// Check if the current user has already applied to a job
export const checkApplied = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}/apply/`);
  return response.data;
};

// Submit a job application
export const applyToJob = async (jobId, coverLetter) => {
  const response = await api.post(`/api/jobs/${jobId}/apply/`, { cover_letter: coverLetter });
  return response.data;
};

// AI improve a cover letter draft
export const aiImproveCoverLetter = async ({ coverLetter, jobTitle, companyName }) => {
  const response = await api.post("/api/jobs/ai-improve-cover-letter/", {
    cover_letter: coverLetter,
    job_title: jobTitle,
    company_name: companyName,
  });
  return response.data;
};
