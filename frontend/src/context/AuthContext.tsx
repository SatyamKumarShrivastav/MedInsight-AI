/**
 * MedInsight AI — Auth Context
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/client';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: 'ADMIN' | 'RESEARCHER' | 'STUDENT' | 'STAFF' | 'CITIZEN' | string;
  institution?: string;
  department?: string;
  degree_branch?: string;
  address?: string;
  country?: string;
  identification_number?: string;
  bio?: string;
  is_active: boolean;
  has_pending_password?: boolean;
  pending_password_requested_at?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { access_token, ...userData } = res.data;
    localStorage.setItem('access_token', access_token);
    setToken(access_token);
    // Fetch full user profile
    const meRes = await authApi.getMe();
    setUser(meRes.data);
    localStorage.setItem('user', JSON.stringify(meRes.data));
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
