import api from "../utils/axios";

export const getVisaTimelines = (params) =>
  api.get("/api/visa/timelines/", { params }).then((r) => r.data);

export const getVisaStats = (params) =>
  api.get("/api/visa/timelines/stats/", { params }).then((r) => r.data);

export const submitVisaTimeline = (data) =>
  api.post("/api/visa/timelines/", data).then((r) => r.data);

export const updateVisaTimeline = (id, data) =>
  api.patch(`/api/visa/timelines/${id}/`, data).then((r) => r.data);

export const deleteVisaTimeline = (id) =>
  api.delete(`/api/visa/timelines/${id}/`);

export const getWhatsAppGroups = (params) =>
  api.get("/api/visa/whatsapp-groups/", { params }).then((r) => r.data);

export const getOccupations = (params) =>
  api.get("/api/visa/occupations/", { params }).then((r) => r.data);

export const getInvitationRounds = (params) =>
  api.get("/api/visa/invitation-rounds/", { params }).then((r) => r.data);
