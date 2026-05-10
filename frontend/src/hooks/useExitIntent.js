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

    // Desktop: cursor reaches top 5px of viewport (heading toward URL bar)
    const handleMouseMove = (e) => {
      if (triggered.current) return;
      if (e.clientY <= 5) {
        triggered.current = true;
        onTrigger();
      }
    };

    // Mobile: show after 30s on the page
    const timer = setTimeout(() => {
      if (triggered.current) return;
      if (window.innerWidth < 768) {
        triggered.current = true;
        onTrigger();
      }
    }, 30000);

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timer);
    };
  }, [onTrigger]);
}
