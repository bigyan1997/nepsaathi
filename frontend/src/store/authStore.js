import { create } from "zustand";
import { persist } from "zustand/middleware";

// Access token: sessionStorage — tab-scoped, cleared on browser close, never persisted
// Refresh token: localStorage — needed so the user stays logged in across page reloads
// Neither token is stored in Zustand state; only the user object is persisted
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (accessToken) sessionStorage.setItem("nepsaathi_access_token", accessToken);
        if (refreshToken) localStorage.setItem("nepsaathi_refresh_token", refreshToken);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        sessionStorage.removeItem("nepsaathi_access_token");
        localStorage.removeItem("nepsaathi_refresh_token");
        localStorage.removeItem("nepsaathi-auth");
        set({ user: null, isAuthenticated: false });
        window.location.href = "/login";
      },

      updateUser: (user) => set({ user }),

      setAccessToken: (accessToken) => {
        sessionStorage.setItem("nepsaathi_access_token", accessToken);
      },
    }),
    {
      name: "nepsaathi-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
