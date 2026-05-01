import api from "../utils/axios";

export const getEvents = async (params = {}) => {
  const response = await api.get("/api/events/", { params });
  return response.data;
};

export const getEvent = async (id) => {
  const response = await api.get(`/api/events/${id}/`);
  return response.data;
};

export const getEventByListing = async (listingSlug) => {
  const response = await api.get(`/api/events/listing/${listingSlug}/`);
  return response.data;
};

export const createEvent = async (data) => {
  const response = await api.post("/api/events/create/", data);
  return response.data;
};

export const updateEvent = async (id, data) => {
  const response = await api.patch(`/api/events/${id}/`, data);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await api.delete(`/api/events/${id}/`);
  return response.data;
};

export const toggleRSVP = async (id) => {
  const response = await api.post(`/api/events/${id}/rsvp/`);
  return response.data;
};
