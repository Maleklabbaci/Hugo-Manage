import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon, ServerIcon } from '../components/Icons';
import type { Language, Theme } from '../types';
import { storage } from '../services/storage';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t, logout, session } = useAppContext();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  useEffect(() => {
    const { supabaseUrl, supabaseAnonKey } = storage.getSupabaseCredentials();
    setSupabaseUrl(supabaseUrl || '');
    setSupabaseAnonKey(supabaseAnonKey || '');
  }, []);
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }

  const handleSaveSupabase = () => {
    if (supabaseUrl && supabaseAnonKey) {
      storage.setSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      alert(t('settings.supabase.saved_message'));
      window.location.reload();
    } else {
      alert(t('settings.supabase.error_missing_fields'));
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-slate-800 dark:text-white">

      <div className="bg-white dark:bg-secondary p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center">
              <ServerIcon className="w-5 h-5 me-2"/> {t('settings.supabase.title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('settings.supabase.description')}
          </p>
          <div className="space-y-4">
              <div>
                  <label htmlFor="supabaseUrl" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('settings.supabase.url_label')}</label>
                  <input type="url" id="supabaseUrl" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="https://xxxxxxxx.supabase.co" />
              </div>
              <div>
                  <label htmlFor="supabaseAnonKey" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('settings.supabase.anon_key_label')}</label>
                  <input type="password" id="supabaseAnonKey" value={supabaseAnonKey} onChange={e => setSupabaseAnonKey(e.target.value)} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="ey..." />
              </div>
              <button
                  onClick={handleSaveSupabase}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg px-4 py-2.5 transform transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/50 hover:-translate-y-0.5"
              >
                  {t('settings.supabase.save_button')}
              </button>
          </div>
      </div>

      <div className="bg-white dark:bg-secondary p-4 sm:p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.theme_title')}</h3>
        <div className="flex items-center justify-between">
          <p>{t('settings.theme_select')}</p>
          <div className="flex rounded-lg p-1 bg-slate-200 dark:bg-dark">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-2 rounded-md transition-colors ${theme === 'light' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}
            >
              <SunIcon className="w-5 h-5"/>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}
            >
              <MoonIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-secondary p-4 sm:p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center"><LanguagesIcon className="w-5 h-5 me-2"/> {t('settings.language_title')}</h3>
        <div className="flex items-center justify-between">
            <p>{t('settings.language_select')}</p>
            <select value={language} onChange={handleLanguageChange} className="bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-cyan-500 focus:border-cyan-500">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
            </select>
        </div>
      </div>

      {session && (
        <div>
          <button
            onClick={logout}
            className="w-full bg-white dark:bg-secondary text-red-500 font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center transition-colors hover:bg-red-500/10 shadow-lg"
          >
            <LogoutIcon className="w-5 h-5 me-2"/>
            {t('settings.logout_button')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;