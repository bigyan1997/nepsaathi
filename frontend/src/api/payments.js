import api from "../utils/axios";

export const createCheckoutSession = async (listingId) => {
  const response = await api.post(`/api/payments/feature/${listingId}/`);
  return response.data;
};

export const getPaymentStatus = async (listingId) => {
  const response = await api.get(`/api/payments/status/${listingId}/`);
  return response.data;
};
