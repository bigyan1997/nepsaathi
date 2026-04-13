import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

/**
 * GuestRoute — wraps pages that should only be visible
 * to users who are NOT logged in (login, register).
 *
 * If user IS logged in:
 *   → redirects to homepage
 *
 * If user is NOT logged in:
 *   → renders the page normally
 */
export default function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
