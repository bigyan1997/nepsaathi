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
// Two events cover the two failure modes:
//   vite:preloadError — Vite fires this for modulepreload failures
//   unhandledrejection — fired for lazy import() failures (e.g. in Instagram WebView)
// Use sessionStorage to prevent an infinite reload loop if the chunk is genuinely missing.
function reloadOnceForStalechunk() {
  if (!sessionStorage.getItem("_chunkReload")) {
    sessionStorage.setItem("_chunkReload", "1");
    window.location.reload();
  }
}
window.addEventListener("vite:preloadError", reloadOnceForStalechunk);
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason instanceof TypeError &&
      e.reason.message.includes("Failed to fetch dynamically imported module")) {
    reloadOnceForStalechunk();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
