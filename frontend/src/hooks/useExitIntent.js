import { useEffect, useRef } from "react";

const STORAGE_KEY = "feedback_last_shown";
const COOLDOWN_DAYS = 7;

function canShow() {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return true;
  const daysSince = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
  return daysSince >= COOLDOWN_DAYS;
}

export function markShown() {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

export default function useExitIntent(onTrigger) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!canShow()) return;

    triggered.current = false;

    // Desktop: cursor reaches top 10px of viewport (heading toward URL bar)
    const handleMouseMove = (e) => {
      if (triggered.current) return;
      if (e.clientY <= 10) {
        triggered.current = true;
        onTrigger();
      }
    };

    // Mobile: show after 15s on the page
    const timer = setTimeout(() => {
      if (triggered.current) return;
      if (window.innerWidth < 768) {
        triggered.current = true;
        onTrigger();
      }
    }, 15000);

    // Mobile: also trigger when user has scrolled 60% down the page
    const handleScroll = () => {
      if (triggered.current) return;
      if (window.innerWidth >= 768) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.6) {
        triggered.current = true;
        onTrigger();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [onTrigger]);
}
