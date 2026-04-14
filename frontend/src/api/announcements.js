import api from "../utils/axios";

// Fetch all active announcements with optional filters
// Example: getAnnouncements({ category: 'sale', is_free: true })
export const getAnnouncements = async (params = {}) => {
  const response = await api.get("/api/announcements/", { params });
  return response.data;
};

// Get a single announcement by ID
export const getAnnouncement = async (id) => {
  const response = await api.get(`/api/announcements/${id}/`);
  return response.data;
};

// Get announcement by parent listing ID
// Used after creating to redirect to detail page
export const getAnnouncementByListing = async (listingId) => {
  const response = await api.get(`/api/announcements/listing/${listingId}/`);
  return response.data;
};

// Create announcement details attached to a listing
export const createAnnouncement = async (data) => {
  const response = await api.post("/api/announcements/create/", data);
  return response.data;
};

// Update announcement details (owner only)
export const updateAnnouncement = async (id, data) => {
  const response = await api.patch(`/api/announcements/${id}/`, data);
  return response.data;
};

// Delete announcement (owner only)
export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/api/announcements/${id}/`);
  return response.data;
};
