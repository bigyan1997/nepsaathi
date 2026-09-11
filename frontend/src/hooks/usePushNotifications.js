import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subscribePush, registerFcmToken } from "../api/push";
import { Capacitor } from "@capacitor/core";

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
  const navigate = useNavigate();

  // Reset on logout so a new user who logs in on the same device gets registered
  useEffect(() => {
    if (!isLoggedIn) {
      attempted.current = false;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || attempted.current) return;
    attempted.current = true;

    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");

          const permResult = await PushNotifications.requestPermissions();
          if (permResult.receive !== "granted") return;

          await PushNotifications.register();

          PushNotifications.addListener("registration", async ({ value: token }) => {
            try {
              await registerFcmToken(token);
            } catch (err) {
              console.warn("[fcm] token registration failed:", err);
            }
          });

          PushNotifications.addListener("registrationError", (err) => {
            console.warn("[fcm] registration error:", err);
          });

          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("[fcm] foreground notification:", notification);
          });

          // Use React Router navigate to avoid a full WebView reload
          PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            const url = action.notification?.data?.url;
            if (url) {
              try {
                const path = new URL(url, window.location.origin).pathname +
                             new URL(url, window.location.origin).search;
                navigate(path);
              } catch {
                window.location.href = url;
              }
            }
          });
        } catch (err) {
          console.warn("[fcm] native push setup failed:", err);
        }
      })();
    } else {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (!VAPID_PUBLIC_KEY) return;
      (async () => {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        await registerPushSubscription();
      })();
    }
  }, [isLoggedIn, navigate]);
}
