import { useEffect, useRef } from "react";
import { subscribePush } from "../api/push";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!VAPID_PUBLIC_KEY) return;
  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    // Always force a fresh subscription so the correct VAPID key is used.
    // After the first successful rotation this is a no-op (unsubscribe returns false).
    if (subscription) {
      await subscription.unsubscribe();
      subscription = null;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await subscribePush(subscription);
  } catch (err) {
    console.warn("[push] subscription failed:", err);
  }
}

export function usePushNotifications(isLoggedIn) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || attempted.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    attempted.current = true;

    (async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      await registerPushSubscription();
    })();
  }, [isLoggedIn]);
}
