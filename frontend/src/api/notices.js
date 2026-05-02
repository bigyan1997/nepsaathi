import api from "../utils/axios";

export const getNotices = async (params = {}) => {
  const response = await api.get("/api/notices/", { params });
  return response.data;
};

export const getNotice = async (id) => {
  const response = await api.get(`/api/notices/${id}/`);
  return response.data;
};

export const getNoticeByListing = async (listingSlug) => {
  const response = await api.get(`/api/notices/listing/${listingSlug}/`);
  return response.data;
};

export const createNotice = async (data) => {
  const response = await api.post("/api/notices/create/", data);
  return response.data;
};

export const updateNotice = async (id, data) => {
  const response = await api.patch(`/api/notices/${id}/`, data);
  return response.data;
};

export const deleteNotice = async (id) => {
  const response = await api.delete(`/api/notices/${id}/`);
  return response.data;
};
