import api from "../utils/axios";

// Reverse Request Board
export const getRequests = async (params = {}) => {
  const response = await api.get("/api/community/requests/", { params });
  return response.data;
};

export const createRequest = async (data) => {
  const response = await api.post("/api/community/requests/", data);
  return response.data;
};

export const deleteRequest = async (id) => {
  await api.delete(`/api/community/requests/${id}/`);
};

// Skills / Services Marketplace
export const getServices = async (params = {}) => {
  const response = await api.get("/api/community/services/", { params });
  return response.data;
};

export const createService = async (data) => {
  const response = await api.post("/api/community/services/", data);
  return response.data;
};

export const deleteService = async (id) => {
  await api.delete(`/api/community/services/${id}/`);
};
