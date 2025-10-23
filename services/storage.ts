import type { Product, ActivityLog, Sale, Theme, Language } from '../types';
import { MOCK_PRODUCTS } from '../mock/products';

const TOKEN_KEY = 'authToken';
const PRODUCTS_KEY = 'products';
const ACTIVITY_LOG_KEY = 'activityLog';
const SALES_KEY = 'sales';
const THEME_KEY = 'theme';
const LANGUAGE_KEY = 'language';

// Helper for getting item from localStorage and parsing it
const getItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage`, error);
    return null;
  }
};

// Helper for setting item in localStorage
const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage`, error);
  }
};

export const storage = {
  // Token management
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Products
  loadProducts: (): Product[] => {
    const products = getItem<Product[]>(PRODUCTS_KEY);
    if (!products || products.length === 0) {
      setItem(PRODUCTS_KEY, MOCK_PRODUCTS);
      return [...MOCK_PRODUCTS];
    }
    return products;
  },
  saveProducts: (products: Product[]): void => {
    setItem(PRODUCTS_KEY, products);
  },

  // Activity Log
  loadActivityLog: (): ActivityLog[] => {
    return getItem<ActivityLog[]>(ACTIVITY_LOG_KEY) || [];
  },
  saveActivityLog: (log: ActivityLog[]): void => {
    setItem(ACTIVITY_LOG_KEY, log);
  },

  // Sales
  loadSales: (): Sale[] => {
    return getItem<Sale[]>(SALES_KEY) || [];
  },
  saveSales: (sales: Sale[]): void => {
    setItem(SALES_KEY, sales);
  },

  // Theme
  getTheme: (): Theme => {
    const theme = localStorage.getItem(THEME_KEY) as Theme;
    if (theme && ['light', 'dark'].includes(theme)) return theme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },
  setTheme: (theme: Theme): void => {
    localStorage.setItem(THEME_KEY, theme);
  },

  // Language
  getLanguage: (): Language => {
    const lang = localStorage.getItem(LANGUAGE_KEY) as Language;
    return lang && ['fr', 'en', 'ar'].includes(lang) ? lang : 'fr';
  },
  setLanguage: (language: Language): void => {
    localStorage.setItem(LANGUAGE_KEY, language);
  },
  
  // Data reset
  resetData: (): void => {
      localStorage.removeItem(PRODUCTS_KEY);
      localStorage.removeItem(ACTIVITY_LOG_KEY);
      localStorage.removeItem(SALES_KEY);
      // We don't remove token, theme, or language on data reset
      // The calling function in AppContext will re-seed products.
  }
};
