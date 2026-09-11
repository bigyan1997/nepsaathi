import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let removeListener;

    async function setup() {
      if (Capacitor.isNativePlatform()) {
        try {
          const { Network } = await import("@capacitor/network");
          const status = await Network.getStatus();
          setOffline(!status.connected);
          const handler = await Network.addListener("networkStatusChange", (s) => {
            setOffline(!s.connected);
          });
          removeListener = () => handler.remove();
        } catch {
          // Plugin not available in this build — fall back to browser events
          const onOnline = () => setOffline(false);
          const onOffline = () => setOffline(true);
          setOffline(!navigator.onLine);
          window.addEventListener("online", onOnline);
          window.addEventListener("offline", onOffline);
          removeListener = () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
          };
        }
      } else {
        const onOnline = () => setOffline(false);
        const onOffline = () => setOffline(true);
        setOffline(!navigator.onLine);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        removeListener = () => {
          window.removeEventListener("online", onOnline);
          window.removeEventListener("offline", onOffline);
        };
      }
    }

    setup();
    return () => removeListener?.();
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1a1a2e",
        color: "#fff",
        textAlign: "center",
        paddingTop: "calc(10px + env(safe-area-inset-top))",
        paddingBottom: "10px",
        paddingLeft: "16px",
        paddingRight: "16px",
        fontSize: "13px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      You're offline — check your connection
    </div>
  );
}
