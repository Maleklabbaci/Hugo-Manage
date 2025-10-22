
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { MOCK_PRODUCTS } from '../mock/products';

// Define a more robust data structure for the entire application
interface UserData {
  products: Product[];
  activityLog: ActivityLog[];
  sales: Sale[];
}

interface UserCredentials {
  [email: string]: { passwordHash: string }; // In a real app, this would be a hash
}

interface AppData {
  users: UserCredentials;
  userData: {
    [email: string]: UserData;
  };
}

const APP_DATA_KEY = 'chezHugoAppData';

// Helper function to get the whole app data object
const loadAppData = (): AppData => {
  try {
    const data = window.localStorage.getItem(APP_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading app data from localStorage:', error);
  }
  // Return a default structure if nothing is found or an error occurs
  return { users: {}, userData: {} };
};

// Helper function to save the whole app data object
const saveAppData = (data: AppData): void => {
  try {
    window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving app data to localStorage:', error);
  }
};

const getInitialUserData = (): UserData => ({
  products: [...MOCK_PRODUCTS],
  sales: [],
  activityLog: [],
});

export const storage = {
  // User Account Management
  findUser: (email: string): { passwordHash: string } | null => {
    const appData = loadAppData();
    return appData.users[email] || null;
  },

  createUser: (email: string, passwordHash: string): void => {
    const appData = loadAppData();
    if (!appData.users[email]) {
      appData.users[email] = { passwordHash };
      appData.userData[email] = getInitialUserData();
      saveAppData(appData);
    }
  },

  // User Session Management
  getCurrentUser: (): string | null => JSON.parse(window.localStorage.getItem('currentUser') || 'null'),
  setCurrentUser: (email: string) => window.localStorage.setItem('currentUser', JSON.stringify(email)),
  clearCurrentUser: () => window.localStorage.removeItem('currentUser'),

  // User-specific Data Management
  loadProducts: (email: string): Product[] => {
    const appData = loadAppData();
    return appData.userData[email]?.products || [];
  },
  saveProducts: (email: string, products: Product[]) => {
    const appData = loadAppData();
    if (appData.userData[email]) {
      appData.userData[email].products = products;
      saveAppData(appData);
    }
  },

  loadActivityLog: (email: string): ActivityLog[] => {
    const appData = loadAppData();
    return appData.userData[email]?.activityLog || [];
  },
  saveActivityLog: (email: string, logs: ActivityLog[]) => {
    const appData = loadAppData();
    if (appData.userData[email]) {
      appData.userData[email].activityLog = logs;
      saveAppData(appData);
    }
  },

  loadSales: (email: string): Sale[] => {
    const appData = loadAppData();
    return appData.userData[email]?.sales || [];
  },
  saveSales: (email: string, sales: Sale[]) => {
    const appData = loadAppData();
    if (appData.userData[email]) {
      appData.userData[email].sales = sales;
      saveAppData(appData);
    }
  },

  // Global Settings (not user-specific)
  getTheme: (): Theme => JSON.parse(window.localStorage.getItem('theme') || '"dark"'),
  setTheme: (theme: Theme) => window.localStorage.setItem('theme', JSON.stringify(theme)),

  getLanguage: (): Language => JSON.parse(window.localStorage.getItem('language') || '"fr"'),
  setLanguage: (lang: Language) => window.localStorage.setItem('language', JSON.stringify(lang)),

  // Data import/export and reset for the CURRENT user
  resetData: (email: string) => {
    const appData = loadAppData();
    if (appData.userData[email]) {
      appData.userData[email] = getInitialUserData();
      saveAppData(appData);
    }
  },
  
  importUserData: (email: string, data: UserData) => {
      const appData = loadAppData();
      appData.userData[email] = data;
      saveAppData(appData);
  },

  exportUserData: (email: string): UserData | null => {
      const appData = loadAppData();
      return appData.userData[email] || null;
  }
};
