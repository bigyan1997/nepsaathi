import api from "../utils/axios";

export const subscribePush = async (subscription) => {
  const keys = subscription.getKey ? {
    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
  } : subscription.toJSON().keys;

  await api.post("/api/users/push/subscribe/", {
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });
};

export const unsubscribePush = async (endpoint) => {
  await api.delete("/api/users/push/subscribe/", { data: { endpoint } });
};
