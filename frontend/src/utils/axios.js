import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nepsaathi_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Token expired or invalid — force logout
    if (status === 401) {
      localStorage.removeItem("nepsaathi_access_token");
      localStorage.removeItem("nepsaathi_refresh_token");
      localStorage.removeItem("nepsaathi-auth");
      window.location.href = "/login";
    }

    // User deleted from database — force logout
    if (status === 403 || status === 404) {
      const url = error.config?.url;
      // Only force logout if it's a user-related endpoint
      if (url?.includes("/api/users/profile")) {
        localStorage.removeItem("nepsaathi_access_token");
        localStorage.removeItem("nepsaathi_refresh_token");
        localStorage.removeItem("nepsaathi-auth");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
