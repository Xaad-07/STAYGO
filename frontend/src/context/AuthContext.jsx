import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

// Holds the currently logged-in user (or null) and exposes login/logout helpers.
// We never use LocalStorage for authentication -- the PHP session cookie
// is the source of truth, and we re-check it once when the app first loads.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load (or full page refresh) ask the backend if a session is active.
  useEffect(() => {
    api
      .get("/auth/check_session.php")
      .then((res) => {
        if (res.data.status === "success") {
          setUser(res.data.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function login(userData) {
    setUser(userData);
  }

  async function logout() {
    await api.post("/auth/logout.php");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Small hook so components can just call useAuth() instead of importing useContext everywhere.
export function useAuth() {
  return useContext(AuthContext);
}
