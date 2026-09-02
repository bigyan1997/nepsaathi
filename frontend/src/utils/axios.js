import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach access token from sessionStorage
api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("nepsaathi_access_token") ||
      localStorage.getItem("nepsaathi_access_token");
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
  sessionStorage.removeItem("nepsaathi_access_token");
  localStorage.removeItem("nepsaathi_access_token");
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
      // No session — only clear auth state if we thought we were logged in
      if (!useAuthStore.getState().isAuthenticated) {
        return Promise.reject(error);
      }

      // Queue concurrent 401s instead of firing multiple refresh calls
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
        // Send empty body — backend reads the httpOnly refresh cookie automatically
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`,
          {},
          { withCredentials: true },
        );
        const newToken = response.data.access;
        sessionStorage.setItem("nepsaathi_access_token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        useAuthStore.getState().setAccessToken?.(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
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
      }
    }

    return Promise.reject(error);
  },
);

export default api;
