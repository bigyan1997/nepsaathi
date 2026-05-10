import { create } from "zustand";
import { persist } from "zustand/middleware";

// Zustand store for NepSaathi authentication state
// persist middleware saves the state to localStorage
// so the user stays logged in after page refresh
const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Actions
      setAuth: (user, accessToken, refreshToken) => {
        // Save tokens to localStorage for axios interceptor
        localStorage.setItem("nepsaathi_access_token", accessToken);
        localStorage.setItem("nepsaathi_refresh_token", refreshToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Clear all token storage locations
        localStorage.removeItem("nepsaathi_access_token");
        localStorage.removeItem("nepsaathi_refresh_token");
        localStorage.removeItem("nepsaathi-auth"); // Zustand persist key — must clear this too or stale auth state survives a page reload
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        // Force a hard navigation to login to ensure memory is wiped
        window.location.href = "/login";
      },

      updateUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        localStorage.setItem("nepsaathi_access_token", accessToken);
        set({ accessToken });
      },
    }),
    {
      name: "nepsaathi-auth",
      // Only persist these fields to localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
