/**
 * @fileoverview OpenPath Component
 * @module Frontend/Contexts/Auth
 * @description Provides authentication state and functions globally via React Context.
 * @dependencies [react, ../api/client]
 * @stateConsumed N/A
 * @stateProduced N/A
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../api/client';

export interface User {
  id: number;
  github_handle: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await ApiClient.get<User>('/api/v1/auth/me');
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    window.location.href = `${baseUrl}/api/v1/auth/github/login`;
  };

  const logout = async () => {
    try {
      await ApiClient.post('/api/v1/auth/logout');
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
