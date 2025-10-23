import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getToken());

  useEffect(() => {
    const token = storage.getToken();
    setIsAuthenticated(!!token);
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@chezhugo.com' && pass === 'admin123') {
          const fakeToken = 'fake-jwt-token';
          storage.setToken(fakeToken);
          setIsAuthenticated(true);
          resolve();
        } else {
          reject(new Error("login.error.incorrect_credentials"));
        }
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    storage.removeToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};