import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if there's a saved token and try to restore the session
  useEffect(() => {
    const token = localStorage.getItem("spliteasy_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("spliteasy_token"))
      .finally(() => setLoading(false));
  }, []);

  async function signup(name, email, password) {
    const res = await api.post("/auth/signup", { name, email, password });
    localStorage.setItem("spliteasy_token", res.data.token);
    setUser(res.data.user);
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("spliteasy_token", res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("spliteasy_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
