
import type { Product, Theme, Language, ActivityLog } from '../types';
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
    const products = get<Product[]>('products', []);
    if (products.length === 0) {
      storage.saveProducts(MOCK_PRODUCTS);
      return MOCK_PRODUCTS;
    }
    return products;
  },
  saveProducts: (products: Product[]) => set<Product[]>('products', products),
  
  loadActivityLog: (): ActivityLog[] => get<ActivityLog[]>('activityLog', []),
  saveActivityLog: (logs: ActivityLog[]) => set<ActivityLog[]>('activityLog', logs),

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
  }
};