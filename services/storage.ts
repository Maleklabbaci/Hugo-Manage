
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { MOCK_PRODUCTS } from '../mock/products';

const get = <T,>(key: string, fallback: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return fallback;
  }
};

const set = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

export const storage = {
  loadProducts: (): Product[] => {
    const productsJSON = window.localStorage.getItem('products');
    if (productsJSON === null) {
      // First time loading, or data was cleared. Initialize with mock data.
      set<Product[]>('products', MOCK_PRODUCTS);
      return MOCK_PRODUCTS;
    }
    // Data exists, parse it (even if it's an empty array '[]').
    return get<Product[]>('products', []);
  },
  saveProducts: (products: Product[]) => set<Product[]>('products', products),
  
  loadActivityLog: (): ActivityLog[] => get<ActivityLog[]>('activityLog', []),
  saveActivityLog: (logs: ActivityLog[]) => set<ActivityLog[]>('activityLog', logs),

  loadSales: (): Sale[] => get<Sale[]>('sales', []),
  saveSales: (sales: Sale[]) => set<Sale[]>('sales', sales),

  getToken: (): string | null => get<string | null>('authToken', null),
  setToken: (token: string) => set<string>('authToken', token),
  removeToken: () => window.localStorage.removeItem('authToken'),
  
  getTheme: (): Theme => get<Theme>('theme', 'dark'),
  setTheme: (theme: Theme) => set<Theme>('theme', theme),

  getLanguage: (): Language => get<Language>('language', 'fr'),
  setLanguage: (lang: Language) => set<Language>('language', lang),

  resetData: () => {
    window.localStorage.removeItem('products');
    window.localStorage.removeItem('activityLog');
    window.localStorage.removeItem('sales');
  }
};
