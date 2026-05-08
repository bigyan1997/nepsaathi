import { useState, useEffect, useCallback } from "react";

const DISMISSED_KEY = "nepsaathi_pwa_dismissed_until";
const DISMISS_DAYS = 7;

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  // Safari but not Chrome/Firefox on iOS
  const isIOSSafari =
    isIOS && /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge|opr/i.test(ua);
  const isSamsungBrowser = /samsungbrowser/i.test(ua);
  // Devices that support beforeinstallprompt
  const supportsNativePrompt = isAndroid || (!isIOS && (isChrome || isSamsungBrowser));

  return { isIOS, isIOSSafari, isAndroid, supportsNativePrompt };
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true
  );
}

function isDismissed() {
  const until = localStorage.getItem(DISMISSED_KEY);
  if (!until) return false;
  return Date.now() < parseInt(until, 10);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceInfo] = useState(getDeviceInfo);

  useEffect(() => {
    // Already running as installed PWA — never show
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }
    // User dismissed recently
    if (isDismissed()) return;

    // Android / Chrome: wait for browser's deferred prompt
    if (deviceInfo.supportsNativePrompt) {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }

    // iOS Safari: show our manual instructions after a brief delay
    if (deviceInfo.isIOSSafari) {
      const t = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, [deviceInfo]);

  // Listen for the app being installed
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback((permanent = false) => {
    setIsVisible(false);
    const until = permanent
      ? Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
      : Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
  }, []);

  return {
    isVisible,
    isInstalled,
    deviceInfo,
    deferredPrompt,
    triggerInstall,
    dismiss,
  };
}
