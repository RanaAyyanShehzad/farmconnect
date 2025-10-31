import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await axios.get("https://agrofarm-vd8i.onrender.com/api/auth/check", {
          withCredentials: true,
        });

        if (res.data.authenticated) {
          setIsAuthenticated(true);
          setRole(res.data.role);
        } else {
          setIsAuthenticated(false);
          setRole(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // const logout = async () => {
  //   await axios.post("https://agrofarm-vd8i.onrender.com/api/auth/logout", {}, { withCredentials: true });
  //   setIsAuthenticated(false);
  //   setRole(null);
  // };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthProvider };
