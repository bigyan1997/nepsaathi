import api from "../utils/axios";

export const getBusinesses = async (params = {}) => {
  const response = await api.get("/api/businesses/", { params });
  return response.data;
};

export const getBusiness = async (slug) => {
  const response = await api.get(`/api/businesses/${slug}/`);
  return response.data;
};

export const createBusiness = async (data) => {
  const response = await api.post("/api/businesses/create/", data);
  return response.data;
};

export const updateBusiness = async (slug, data) => {
  const response = await api.patch(`/api/businesses/${slug}/`, data);
  return response.data;
};

export const deleteBusiness = async (slug) => {
  const response = await api.delete(`/api/businesses/${slug}/`);
  return response.data;
};

export const getMyBusinesses = async () => {
  const response = await api.get("/api/businesses/my-businesses/");
  return response.data;
};

export const getBusinessReviews = async (slug) => {
  const response = await api.get(`/api/businesses/${slug}/reviews/`);
  return response.data;
};

export const addBusinessReview = async (slug, data) => {
  const response = await api.post(`/api/businesses/${slug}/reviews/`, data);
  return response.data;
};

export const deleteBusinessReview = async (businessSlug, reviewId) => {
  const response = await api.delete(`/api/businesses/${businessSlug}/reviews/${reviewId}/`);
  return response.data;
};
