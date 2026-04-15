import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const COLORS = {
    success: { bg: "#E1F5EE", border: "#9FE1CB", color: "#085041", icon: "✅" },
    error: { bg: "#FCEBEB", border: "#F09595", color: "#A32D2D", icon: "❌" },
    info: { bg: "#EEEDFE", border: "#AFA9EC", color: "#3C3489", icon: "ℹ️" },
    warning: { bg: "#FFF1E0", border: "#EFD9C0", color: "#633806", icon: "⚠️" },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "340px",
        }}
      >
        {toasts.map((toast) => {
          const style = COLORS[toast.type] || COLORS.success;
          return (
            <div
              key={toast.id}
              style={{
                background: style.bg,
                border: `0.5px solid ${style.border}`,
                borderRadius: "10px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                animation: "slideIn 0.2s ease-out",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>
                {style.icon}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: style.color,
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: style.color,
                  fontSize: "14px",
                  padding: "0",
                  flexShrink: 0,
                  opacity: 0.6,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
