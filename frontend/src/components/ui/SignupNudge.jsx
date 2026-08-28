import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import useIsMobile from "../../hooks/useIsMobile";

const STORAGE_KEY = "nepsaathi_signup_nudge";
const COOKIE_KEY = "nepsaathi_cookie_consent";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_PATHS = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"];

export default function SignupNudge() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const location = useLocation();
  const isMobile = useIsMobile(768);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Hide immediately if the user lands on or navigates to an auth page
    if (AUTH_PATHS.some((p) => location.pathname.startsWith(p))) {
      setVisible(false);
      return;
    }
    if (isAuthenticated) return;

    // Don't compete with the CookieConsent bar — wait until it's been answered
    if (!localStorage.getItem(COOKIE_KEY)) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { dismissedAt } = JSON.parse(raw);
        if (Date.now() - dismissedAt < DISMISS_MS) return;
      }
    } catch {
      // ignore parse errors
    }

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setVisible(true);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };

    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      if (total > 0 && window.scrollY / total > 0.3) trigger();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setTimeout(trigger, 4000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [isAuthenticated, location.pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
    } catch {}
    setVisible(false);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const data = await googleLogin(tokenResponse.access_token);
        setAuth(data.user, data.access, data.refresh);
        setVisible(false);
      } catch {
        // silently fail — user can try via /login
      } finally {
        setLoading(false);
      }
    },
  });

  if (!visible) return null;

  // On mobile, sit above the BottomNav (58px) + safe area
  const bottomOffset = isMobile ? "calc(58px + env(safe-area-inset-bottom))" : 0;

  return (
    <div
      role="dialog"
      aria-label="Sign up to NepSaathi"
      style={{
        position: "fixed",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        zIndex: 500,
        background: "#26215C",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: isMobile ? "14px 16px" : "14px 28px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.22)",
        animation: "nudge-in 0.3s cubic-bezier(.2,.8,.4,1) both",
      }}
    >
      <style>{`
        @keyframes nudge-in {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Text */}
      <div style={{ flex: 1, minWidth: "160px" }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
          Join NepSaathi — it's free
        </div>
        <div style={{ fontSize: "12px", color: "#AFA9EC", lineHeight: 1.5 }}>
          Post jobs, find rooms, message members &amp; more.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flexShrink: 0 }}>
        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#26215C",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <Link
          to="/register"
          style={{
            fontSize: "12.5px",
            color: "#AFA9EC",
            textDecoration: "none",
            whiteSpace: "nowrap",
            padding: "9px 2px",
          }}
          onClick={dismiss}
        >
          Sign up with email
        </Link>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss sign up prompt"
        style={{
          background: "transparent",
          border: "none",
          color: "#7A74B8",
          fontSize: "20px",
          lineHeight: 1,
          padding: "4px 6px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
