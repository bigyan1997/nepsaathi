import api from "../utils/axios";

// Fetch all active room listings with optional filters
export const getRooms = async (params = {}) => {
  const response = await api.get("/api/rooms/", { params });
  return response.data;
};

// Get a single room by ID
export const getRoom = async (id) => {
  const response = await api.get(`/api/rooms/${id}/`);
  return response.data;
};

// Get a room by its parent listing ID
// Used after creating a listing to redirect to detail page
export const getRoomByListing = async (listingId) => {
  const response = await api.get(`/api/rooms/listing/${listingId}/`);
  return response.data;
};

// Create room details attached to a listing
export const createRoom = async (data) => {
  const response = await api.post("/api/rooms/create/", data);
  return response.data;
};

// Update room details (owner only)
export const updateRoom = async (id, data) => {
  const response = await api.patch(`/api/rooms/${id}/`, data);
  return response.data;
};
