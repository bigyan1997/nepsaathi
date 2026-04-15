import {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";

const ProgressContext = createContext(null);

export function useProgress() {
  return useContext(ProgressContext);
}

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // Auto trigger on route change
  useEffect(() => {
    start();
    const timer = setTimeout(() => done(), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const start = useCallback(() => {
    setVisible(true);
    setProgress(10);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  }, []);

  const done = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  return (
    <ProgressContext.Provider value={{ start, done }}>
      {/* Progress bar */}
      {visible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            height: "3px",
            background: "rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #E87722, #534AB7)",
              borderRadius: "0 2px 2px 0",
              transition: "width 0.2s ease-out",
              boxShadow: "0 0 8px rgba(232, 119, 34, 0.6)",
            }}
          />
        </div>
      )}
      {children}
    </ProgressContext.Provider>
  );
}
