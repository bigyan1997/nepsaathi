import api from "../utils/axios";

export const getAdminStats = () =>
  api.get("/api/panel/stats/").then((r) => r.data);
