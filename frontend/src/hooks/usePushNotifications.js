import { useEffect, useRef } from "react";
import { subscribePush } from "../api/push";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BAYeurSjKLbQBUlckoFxN3EtIes7Ht24pD-x46Izvm5n4vie5mAX1AQNwJd82iTY6AUl0cwTAW9R-Hgbubum8hI";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(isLoggedIn) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || attempted.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    attempted.current = true;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        await subscribePush(subscription);
      } catch {
        // silently fail — push is non-critical
      }
    })();
  }, [isLoggedIn]);
}
