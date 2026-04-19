import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach access token
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

// Response interceptor — handle token expiry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuth = () => {
  localStorage.removeItem("nepsaathi_access_token");
  localStorage.removeItem("nepsaathi_refresh_token");
  localStorage.removeItem("nepsaathi-auth");
  useAuthStore.getState().logout();
};
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Try to refresh token on 401
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("nepsaathi_refresh_token");

      // No refresh token — only redirect if was logged in
      if (!refreshToken) {
        if (localStorage.getItem("nepsaathi_access_token")) {
          clearAuth();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken },
        );
        const newToken = response.data.access;
        localStorage.setItem("nepsaathi_access_token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Force logout on profile 403/404
    if (status === 403 || status === 404) {
      const url = error.config?.url;
      if (url?.includes("/api/users/profile")) {
        clearAuth();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
