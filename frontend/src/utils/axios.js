import axios from "axios";

// Base axios instance pointing to our Django backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
// Before every API call, check if we have a JWT token
// and attach it to the Authorization header automatically
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

// Response interceptor
// If Django returns 401 (token expired), clear the token
// and redirect to login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nepsaathi_access_token");
      localStorage.removeItem("nepsaathi_refresh_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
