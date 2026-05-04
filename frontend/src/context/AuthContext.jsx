import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [userName, setUserName] = useState(localStorage.getItem("userName"));

  function login(accessToken, userRole, name) {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("role", userRole);
    localStorage.setItem("userName", name);
    setToken(accessToken);
    setRole(userRole);
    setUserName(name);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    setToken(null);
    setRole(null);
    setUserName(null);
  }

  const value = { token, role, userName, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
