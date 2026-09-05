import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@sentry")) return "vendor-sentry";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) return "vendor-react";
          if (id.includes("node_modules/axios") || id.includes("node_modules/zustand") || id.includes("node_modules/react-helmet") || id.includes("node_modules/@react-oauth")) return "vendor-misc";
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    css: false,
  },
});
