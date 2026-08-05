"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthAPI, User, getToken, setToken, clearToken } from "./api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await AuthAPI.getCurrentUser();
        setUser(me);
      } catch {
        clearToken(); // token expired/invalid
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const res = await AuthAPI.login(email, password);
    setToken(res.access_token);
    const me = await AuthAPI.getCurrentUser();
    setUser(me);
  }

  async function register(name: string, email: string, password: string) {
    await AuthAPI.register(name, email, password);
    await login(email, password); // auto-login after register
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}