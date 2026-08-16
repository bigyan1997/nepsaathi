import { useEffect, useRef, useCallback } from "react";

const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

export default function useIdleTimeout({ warningAfter, logoutAfter, onWarning, onTimeout }) {
  const warningTimer = useRef(null);
  const logoutTimer = useRef(null);
  const isWarning = useRef(false);

  const stop = useCallback(() => {
    clearTimeout(warningTimer.current);
    clearTimeout(logoutTimer.current);
  }, []);

  const reset = useCallback(() => {
    if (isWarning.current) return; // don't reset while modal is open
    stop();
    warningTimer.current = setTimeout(() => {
      isWarning.current = true;
      onWarning();
      logoutTimer.current = setTimeout(onTimeout, logoutAfter);
    }, warningAfter);
  }, [warningAfter, logoutAfter, onWarning, onTimeout, stop]);

  // Called when user clicks "Stay" — clears warning state and restarts idle clock
  const stay = useCallback(() => {
    isWarning.current = false;
    stop();
    warningTimer.current = setTimeout(() => {
      isWarning.current = true;
      onWarning();
      logoutTimer.current = setTimeout(onTimeout, logoutAfter);
    }, warningAfter);
  }, [warningAfter, logoutAfter, onWarning, onTimeout, stop]);

  useEffect(() => {
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
      stop();
    };
  }, [reset, stop]);

  return { stay, stop };
}
