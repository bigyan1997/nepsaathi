import { create } from "zustand";
import { persist } from "zustand/middleware";

// Access token: sessionStorage — tab-scoped, cleared on browser close, never persisted
// Refresh token: httpOnly cookie set by the backend — never readable by JS (XSS-safe)
// Neither token is stored in Zustand state; only the user object is persisted
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        if (accessToken) sessionStorage.setItem("nepsaathi_access_token", accessToken);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        sessionStorage.removeItem("nepsaathi_access_token");
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
        // Persist minimal display fields only. Privilege flags and sensitive PII
        // are stripped — both are re-fetched from the server on every page load.
        user: state.user
          ? {
              ...state.user,
              is_staff: undefined,
              is_superuser: undefined,
              phone: undefined,
              bio: undefined,
              referral_code: undefined,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
