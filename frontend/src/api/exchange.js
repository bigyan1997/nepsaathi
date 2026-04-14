import api from "../utils/axios";

export const getExchangeRates = async () => {
  const response = await api.get("/api/exchange/");
  return response.data;
};
