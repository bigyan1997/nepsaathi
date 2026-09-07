import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.jsx";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,   // 10% of page loads for performance tracing
    replaysOnErrorSampleRate: 1.0,  // full session replay on every error
    integrations: [Sentry.replayIntegration()],
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// After a new deployment, old JS chunk filenames no longer exist on the server.
// Vite fires this event when a dynamic import (lazy page) fails to load.
// Force a full reload so the browser fetches the fresh index.html and new chunks.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
