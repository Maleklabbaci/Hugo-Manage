import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon, ServerIcon } from '../components/Icons';
import type { Language, Theme } from '../types';
import { motion } from 'framer-motion';
import { storage } from '../services/storage';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t, logout, session, saveSupabaseCredentials } = useAppContext();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  useEffect(() => {
    const creds = storage.getSupabaseCredentials();
    if (creds.url) setSupabaseUrl(creds.url);
    if (creds.anonKey) setSupabaseAnonKey(creds.anonKey);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }

  const handleSupabaseSave = () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
        alert(t('settings.supabase.error_missing_fields'));
        return;
    }
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-gray-900 dark:text-white">

      <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-200 dark:border-white/10 flex items-center">
          <ServerIcon className="w-5 h-5 me-2" /> {t('settings.supabase.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{t('settings.supabase.description')}</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('settings.supabase.url_label')}</label>
            <input type="text" id="supabaseUrl" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="https://xxxx.supabase.co" />
          </div>
          <div>
            <label htmlFor="supabaseAnonKey" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('settings.supabase.anon_key_label')}</label>
            <input type="text" id="supabaseAnonKey" value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="ey..." />
          </div>
        </div>
        <div className="mt-4">
          <motion.button onClick={handleSupabaseSave} className="w-full bg-cyan-500/10 text-cyan-500 font-semibold rounded-lg px-4 py-2 flex items-center justify-center transition-colors hover:bg-cyan-500/20" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {t('settings.supabase.save_button')}
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-white/10">{t('settings.theme_title')}</h3>
        <div className="flex items-center justify-between">
          <p>{t('settings.theme_select')}</p>
          <div className="relative flex w-32 rounded-lg p-1 bg-gray-200 dark:bg-black/20">
            <button
              onClick={() => handleThemeChange('light')}
              className={`relative z-10 flex-1 p-2 rounded-md transition-colors text-center ${theme === 'light' ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}
            >
              <SunIcon className="w-5 h-5 mx-auto"/>
              {theme === 'light' && <motion.div layoutId="active-theme" className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-md shadow-lg -z-10" />}
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`relative z-10 flex-1 p-2 rounded-md transition-colors text-center ${theme === 'dark' ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}
            >
              <MoonIcon className="w-5 h-5 mx-auto"/>
              {theme === 'dark' && <motion.div layoutId="active-theme" className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-md shadow-lg -z-10" />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-white/10 flex items-center"><LanguagesIcon className="w-5 h-5 me-2"/> {t('settings.language_title')}</h3>
        <div className="flex items-center justify-between">
            <p>{t('settings.language_select')}</p>
            <select value={language} onChange={handleLanguageChange} className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-cyan-500 focus:border-cyan-500">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
            </select>
        </div>
      </div>

      {session && (
        <div>
          <motion.button
            onClick={logout}
            className="w-full bg-red-500/10 dark:bg-red-500/10 text-red-500 font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center transition-colors hover:bg-red-500/20"
            whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <LogoutIcon className="w-5 h-5 me-2"/>
            {t('settings.logout_button')}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default Settings;
