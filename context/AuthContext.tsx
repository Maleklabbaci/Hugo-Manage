import React, { createContext, useContext } from 'react';

// This context is now deprecated and its logic has been merged into AppContext.
// This file is kept to avoid breaking imports but should be considered empty.

interface DeprecatedAuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<DeprecatedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = {
      isAuthenticated: false,
      login: async () => { console.warn("AuthProvider is deprecated."); },
      logout: () => { console.warn("AuthProvider is deprecated."); },
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): DeprecatedAuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};