import api from "../utils/axios";

export const getRates = async () => {
  const res = await api.get("/api/remittance/rates/");
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
};
