import api from "../utils/axios";

export const getBusinesses = async (params = {}) => {
  const response = await api.get("/api/businesses/", { params });
  return response.data;
};

export const getBusiness = async (id) => {
  const response = await api.get(`/api/businesses/${id}/`);
  return response.data;
};

export const createBusiness = async (data) => {
  const response = await api.post("/api/businesses/create/", data);
  return response.data;
};

export const updateBusiness = async (id, data) => {
  const response = await api.patch(`/api/businesses/${id}/`, data);
  return response.data;
};

export const deleteBusiness = async (id) => {
  const response = await api.delete(`/api/businesses/${id}/`);
  return response.data;
};

export const getMyBusinesses = async () => {
  const response = await api.get("/api/businesses/my-businesses/");
  return response.data;
};

export const getBusinessReviews = async (id) => {
  const response = await api.get(`/api/businesses/${id}/reviews/`);
  return response.data;
};

export const addBusinessReview = async (id, data) => {
  const response = await api.post(`/api/businesses/${id}/reviews/`, data);
  return response.data;
};

export const deleteBusinessReview = async (businessId, reviewId) => {
  const response = await api.delete(`/api/businesses/${businessId}/reviews/${reviewId}/`);
  return response.data;
};
