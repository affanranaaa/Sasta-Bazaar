import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const response = await api.get("/api/auth/profile/");
    setUser(response.data);
    return response.data;
  }, []);

  const login = useCallback(
    async (username, password) => {
      const response = await api.post("/api/auth/login/", {
        username,
        password,
      });

      const { access, refresh } = response.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      try {
        await fetchProfile();
      } catch (error) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        throw error;
      }
    },
    [fetchProfile],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const register = useCallback(async (userData) => {
    return api.post("/api/auth/register/", userData);
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      const accessToken = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        await fetchProfile();
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const handleAuthLogout = () => {
      if (active) {
        logout();
      }
    };

    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      active = false;
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [fetchProfile, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
