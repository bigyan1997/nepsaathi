import axios from "axios";
import useAuthStore from "../store/authStore";

// Translates raw DRF/server messages into human-readable text.
// The backend exception handler handles most cases; this is a frontend safety net.
const FRIENDLY_MESSAGES = {
  "request was throttled": (msg) => {
    const secs = parseInt(msg.match(/\d+/)?.[0] || "0", 10);
    const mins = Math.ceil(secs / 60);
    const wait = mins >= 60 ? `${Math.ceil(mins / 60)} hour${Math.ceil(mins / 60) !== 1 ? "s" : ""}` : mins > 1 ? `${mins} minutes` : "a moment";
    return `You're doing that too often. Please wait ${wait} and try again.`;
  },
  "authentication credentials were not provided": () => "Please sign in to continue.",
  "given token not valid": () => "Your session has expired. Please sign in again.",
  "token is invalid or expired": () => "Your session has expired. Please sign in again.",
  "no active account found": () => "Incorrect email or password.",
  "permission denied": () => "You don't have permission to do that.",
  "not found": () => "That item could not be found.",
  "method not allowed": () => "This action is not supported.",
  "this field may not be blank": () => "This field is required.",
  "this field may not be null": () => "This field is required.",
};

export function friendlyError(err) {
  const data = err?.response?.data;
  const status = err?.response?.status;

  if (status === 429 || (data?.detail && data.detail.toLowerCase().includes("throttled"))) {
    const secs = parseInt(data?.detail?.match(/\d+/)?.[0] || "0", 10);
    const mins = Math.ceil(secs / 60);
    const wait = mins >= 60 ? `${Math.ceil(mins / 60)} hour${Math.ceil(mins / 60) !== 1 ? "s" : ""}` : mins > 1 ? `${mins} minutes` : "a moment";
    return `You're doing that too often. Please wait ${wait} and try again.`;
  }

  if (!data) return null;

  // detail string
  const detail = typeof data === "string" ? data : data?.detail;
  if (detail && typeof detail === "string") {
    const lower = detail.toLowerCase();
    for (const [key, fn] of Object.entries(FRIENDLY_MESSAGES)) {
      if (lower.includes(key)) return fn(detail);
    }
    // Return as-is if it looks like a human message already (short, no tech jargon)
    return detail;
  }

  // Field errors — take the first one
  if (typeof data === "object") {
    const first = Object.values(data)[0];
    const msg = Array.isArray(first) ? first[0] : first;
    if (typeof msg === "string") {
      const lower = msg.toLowerCase();
      for (const [key, fn] of Object.entries(FRIENDLY_MESSAGES)) {
        if (lower.includes(key)) return fn(msg);
      }
      return msg;
    }
  }

  return null;
}

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
