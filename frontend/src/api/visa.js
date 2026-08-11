import api from "../utils/axios";

export const getVisaTimelines = (params) =>
  api.get("/visa/timelines/", { params }).then((r) => r.data);

export const getVisaStats = (params) =>
  api.get("/visa/timelines/stats/", { params }).then((r) => r.data);

export const submitVisaTimeline = (data) =>
  api.post("/visa/timelines/", data).then((r) => r.data);

export const updateVisaTimeline = (id, data) =>
  api.patch(`/visa/timelines/${id}/`, data).then((r) => r.data);

export const deleteVisaTimeline = (id) =>
  api.delete(`/visa/timelines/${id}/`);

export const getWhatsAppGroups = (params) =>
  api.get("/visa/whatsapp-groups/", { params }).then((r) => r.data);

export const getOccupations = (params) =>
  api.get("/visa/occupations/", { params }).then((r) => r.data);

export const getInvitationRounds = (params) =>
  api.get("/visa/invitation-rounds/", { params }).then((r) => r.data);
