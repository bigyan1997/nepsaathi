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

// Get a job by its parent listing ID
// Used after creating a listing to redirect to detail page
export const getJobByListing = async (listingId) => {
  const response = await api.get(`/api/jobs/listing/${listingId}/`);
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
