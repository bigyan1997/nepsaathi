import api from "../utils/axios";

// Fetch all active room listings with optional filters
// Example: getRooms({ room_type: 'private', bills_included: true })
export const getRooms = async (params = {}) => {
  const response = await api.get("/api/rooms/", { params });
  return response.data;
};

// Get a single room by ID
export const getRoom = async (id) => {
  const response = await api.get(`/api/rooms/${id}/`);
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
