import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function PageWrapper({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.classList.remove("page-transition");
      // Force reflow
      void ref.current.offsetWidth;
      ref.current.classList.add("page-transition");
    }
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-transition">
      {children}
    </div>
  );
}
