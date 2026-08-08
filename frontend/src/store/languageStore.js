import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLanguageStore = create(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((state) => ({ lang: state.lang === "en" ? "np" : "en" })),
    }),
    { name: "nepsaathi-lang" }
  )
);

export default useLanguageStore;
