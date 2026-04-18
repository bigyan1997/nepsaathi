import api from "../utils/axios";

// Fetch all active listings with optional filters
// Example: getListings({ listing_type: 'job', state: 'NSW' })
export const getListings = async (params = {}) => {
  const response = await api.get("/api/listings/", { params });
  return response.data;
};

// Get a single listing by ID
export const getListing = async (id) => {
  const response = await api.get(`/api/listings/${id}/`);
  return response.data;
};

// Create a new base listing (must be logged in)
export const createListing = async (data) => {
  const response = await api.post("/api/listings/create/", data);
  return response.data;
};

// Update a listing (owner only)
export const updateListing = async (id, data) => {
  const response = await api.patch(`/api/listings/${id}/`, data);
  return response.data;
};

// Delete a listing (owner only)
export const deleteListing = async (id) => {
  const response = await api.delete(`/api/listings/${id}/`);
  return response.data;
};

// Get all listings posted by the logged in user
export const getMyListings = async () => {
  const response = await api.get("/api/listings/my-listings/");
  return response.data;
};

// Upload images to a listing
export const uploadImages = async (listingId, images) => {
  const formData = new FormData();
  images.forEach((image) => formData.append("images", image));
  const response = await api.post(
    `/api/listings/${listingId}/images/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const getStats = async () => {
  const response = await api.get("/api/listings/stats/");
  return response.data;
};

// Save/bookmark a listing
export const saveListing = async (id) => {
  const response = await api.post(`/api/listings/${id}/save/`);
  return response.data;
};

// Unsave/unbookmark a listing
export const unsaveListing = async (id) => {
  const response = await api.delete(`/api/listings/${id}/save/`);
  return response.data;
};

// Check if listing is saved
export const checkSaved = async (id) => {
  const response = await api.get(`/api/listings/${id}/save/`);
  return response.data;
};

// Get all saved listings
export const getSavedListings = async () => {
  const response = await api.get("/api/listings/saved/");
  return response.data;
};

// Mark Listing Status
export const markListingStatus = async (id, status) => {
  const response = await api.patch(`/api/listings/${id}/status/`, { status });
  return response.data;
};
