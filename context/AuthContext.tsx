import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass:string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
        } catch (error) {
          console.error("Session validation failed:", error);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    // This new logic handles both user creation on the first run and subsequent logins gracefully.
    try {
      // Step 1: Attempt to create the user.
      await api.createUser(email, pass);
    } catch (createErr: any) {
      // Step 2: If creation fails because the user already exists, this is the expected behavior for a returning user.
      // We ignore this specific error and proceed to login.
      // If it's any other error (e.g., weak password), we throw it.
      if (createErr.message !== 'This account is already in use.') {
        console.error("Failed to create user:", createErr);
        throw createErr; // Re-throw unexpected creation errors.
      }
      // If the error is "This account is already in use.", we proceed silently.
    }

    // Step 3: Now, attempt to log in.
    // This will either be the first login after a successful creation, or a login for an existing user.
    try {
      const { authToken } = await api.login(email, pass);
      localStorage.setItem('authToken', JSON.stringify(authToken));
      const user = await api.getMe();
      setCurrentUser(user);
    } catch (loginErr) {
      // If login fails here, it's most likely due to an incorrect password.
      console.error("Failed to log in after create/check:", loginErr);
      throw new Error('login.error.incorrect_credentials'); // Provide a clear error message.
    }
  }, []);
  
  const logout = useCallback(() => {
    api.logout();
    setCurrentUser(null);
  }, []);
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isLoading, login, logout }}>
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