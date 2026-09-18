import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a page so it's only reachable by a logged-in user, optionally
// restricted to one role. Not logged in -> Login page.
// Wrong role -> Home page (per spec: "wrong role -> unauthorized page or correct dashboard").
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
