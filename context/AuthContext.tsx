
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(storage.getCurrentUser());
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const user = storage.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = storage.findUser(email);

        if (user) {
          // User exists, check password
          if (user.passwordHash === pass) { // Plain text comparison for this mock-up
            storage.setCurrentUser(email);
            setCurrentUser(email);
            resolve();
          } else {
            reject(new Error("login.error.incorrect_credentials"));
          }
        } else {
          // User does not exist, create a new account
          storage.createUser(email, pass);
          storage.setCurrentUser(email);
          setCurrentUser(email);
          resolve();
        }
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    storage.clearCurrentUser();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
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
