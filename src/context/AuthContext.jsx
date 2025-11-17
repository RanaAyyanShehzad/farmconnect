import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "../features/userSlice";
import { fetchProfileForRole } from "../services/profileService";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const normalizeRole = useCallback((value) => {
    if (typeof value !== "string") return null;
    return value.toLowerCase();
  }, []);

  const hydrateProfile = useCallback(
    async (nextRole) => {
      if (!nextRole) {
        dispatch(clearUser());
        return;
      }
      try {
        const profile = await fetchProfileForRole(nextRole);
        dispatch(setUser({ name: profile.name, img: profile.img }));
      } catch (err) {
        // swallow profile errors, UI can still rely on auth state
      }
    },
    [dispatch]
  );

  const refreshAuth = useCallback(async () => {
    try {
      const res = await axios.get(
        "https://agrofarm-vd8i.onrender.com/api/auth/check",
        {
          withCredentials: true,
        }
      );

      if (res.data.authenticated) {
        setIsAuthenticated(true);
        const resolvedRole = normalizeRole(res.data.role);
        setRole(resolvedRole);
        hydrateProfile(resolvedRole);
      } else {
        setIsAuthenticated(false);
        setRole(null);
        dispatch(clearUser());
      }
    } catch (err) {
      setIsAuthenticated(false);
      setRole(null);
      dispatch(clearUser());
    } finally {
      setLoading(false);
    }
  }, [normalizeRole, hydrateProfile, dispatch]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = (userRole) => {
    setIsAuthenticated(true);
    const resolvedRole = normalizeRole(userRole);
    setRole(resolvedRole);
    hydrateProfile(resolvedRole);
    setLoading(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    dispatch(clearUser());
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, role, loading, login, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthProvider };
