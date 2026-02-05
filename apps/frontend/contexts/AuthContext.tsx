"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UserDTO, RegisterInput, LoginInput } from "shared";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          const { user } = await authApi.getCurrentUser(storedToken);
          setUser(user);
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginInput) => {
    const response = await authApi.login(credentials);
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem(TOKEN_KEY, response.token);
  };

  const register = async (data: RegisterInput) => {
    const response = await authApi.register(data);
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem(TOKEN_KEY, response.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const { user } = await authApi.getCurrentUser(token);
        setUser(user);
      } catch (error) {
        console.error("Failed to refresh user:", error);
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
