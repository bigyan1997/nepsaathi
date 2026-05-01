import api from "../utils/axios";

// Fetch all active listings with optional filters
// Example: getListings({ listing_type: 'job', state: 'NSW' })
export const getListings = async (params = {}) => {
  const response = await api.get("/api/listings/", { params });
  return response.data;
};

// Get a single listing by slug
export const getListing = async (slug) => {
  const response = await api.get(`/api/listings/${slug}/`);
  return response.data;
};

// Create a new base listing (must be logged in)
export const createListing = async (data) => {
  const response = await api.post("/api/listings/create/", data);
  return response.data;
};

// Update a listing (owner only)
export const updateListing = async (slug, data) => {
  const response = await api.patch(`/api/listings/${slug}/`, data);
  return response.data;
};

// Delete a listing (owner only)
export const deleteListing = async (slug) => {
  const response = await api.delete(`/api/listings/${slug}/`);
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
  try {
    const response = await api.post(
      `/api/listings/${listingId}/images/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 413) throw new Error("Image file is too large to upload.");
    if (status === 415) throw new Error("Unsupported image format.");
    throw err;
  }
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

// View Count
export const trackView = async (id) => {
  const response = await api.post(`/api/listings/${id}/view/`);
  return response.data;
};

// Similar Listing
export const getSimilarListings = async (id) => {
  const response = await api.get(`/api/listings/${id}/similar/`);
  return response.data;
};

// Search Suggestions
export const getSearchSuggestions = async (q) => {
  const response = await api.get(`/api/listings/search-suggestions/?q=${q}`);
  return response.data;
};

// Global Search
export const globalSearch = async (q, state) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (state) params.set("state", state);
  const response = await api.get(`/api/listings/search/?${params.toString()}`);
  return response.data;
};

// Renew Listing
export const renewListing = async (listingId) => {
  const response = await api.post(`/api/listings/${listingId}/renew/`);
  return response.data;
};

// Get Featured Listings
export const getFeaturedListings = async () => {
  const response = await api.get("/api/listings/?is_featured=true&page_size=6");
  return response.data;
};

// Saved searches
export const getSavedSearches = async () => {
  const response = await api.get("/api/listings/saved-searches/");
  return response.data;
};

export const createSavedSearch = async (data) => {
  const response = await api.post("/api/listings/saved-searches/", data);
  return response.data;
};

export const updateSavedSearch = async (id, data) => {
  const response = await api.patch(`/api/listings/saved-searches/${id}/`, data);
  return response.data;
};

export const deleteSavedSearch = async (id) => {
  const response = await api.delete(`/api/listings/saved-searches/${id}/`);
  return response.data;
};
