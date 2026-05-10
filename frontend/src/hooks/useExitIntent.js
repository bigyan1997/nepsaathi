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

    // Desktop: mouse leaves viewport toward top
    const handleMouseLeave = (e) => {
      if (triggered.current) return;
      if (e.clientY <= 10) {
        triggered.current = true;
        onTrigger();
      }
    };

    // Mobile: show after 60s of being on the page
    const timer = setTimeout(() => {
      if (triggered.current) return;
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        triggered.current = true;
        onTrigger();
      }
    }, 60000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, [onTrigger]);
}
