import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

/**
 * ProtectedRoute — wraps pages that require login.
 *
 * If user is NOT logged in:
 *   → redirects to /login
 *   → saves the page they were trying to visit
 *   → after login, sends them back there
 *
 * If user IS logged in:
 *   → renders the page normally
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save where they were trying to go
    // After login we'll redirect them back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
