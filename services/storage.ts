import type { Theme, Language } from '../types';

const TOKEN_KEY = 'authToken';
const THEME_KEY = 'theme';
const LANGUAGE_KEY = 'language';
const SUPABASE_URL_KEY = 'supabaseUrl';
const SUPABASE_ANON_KEY = 'supabaseAnonKey';

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

  // Supabase Credentials
  getSupabaseCredentials: (): { supabaseUrl: string | null, supabaseAnonKey: string | null } => {
    return {
      supabaseUrl: localStorage.getItem(SUPABASE_URL_KEY),
      supabaseAnonKey: localStorage.getItem(SUPABASE_ANON_KEY),
    };
  },
  setSupabaseCredentials: (url: string, key: string): void => {
    localStorage.setItem(SUPABASE_URL_KEY, url);
    localStorage.setItem(SUPABASE_ANON_KEY, key);
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
};