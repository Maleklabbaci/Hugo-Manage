import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon } from '../components/Icons';
import type { Language, Theme } from '../types';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const { logout } = useAuth();
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-800 dark:text-white">
      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.theme_title')}</h3>
        <div className="flex items-center space-x-4">
          <p>{t('settings.theme_select')}</p>
          <div className="flex rounded-lg p-1 bg-slate-200 dark:bg-dark">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-2 rounded-md ${theme === 'light' ? 'bg-accent text-dark' : 'text-slate-500 dark:text-slate-300'}`}
            >
              <SunIcon className="w-5 h-5"/>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-2 rounded-md ${theme === 'dark' ? 'bg-accent text-dark' : 'text-slate-500 dark:text-slate-300'}`}
            >
              <MoonIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center"><LanguagesIcon className="w-5 h-5 me-2"/> {t('settings.language_title')}</h3>
        <div className="flex items-center space-x-4">
            <p>{t('settings.language_select')}</p>
            <select value={language} onChange={handleLanguageChange} className="bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
            </select>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.session_title')}</h3>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors w-full flex items-center justify-center"
        >
          <LogoutIcon className="w-5 h-5 me-2"/>
          {t('settings.logout_button')}
        </button>
      </div>
    </div>
  );
};

export default Settings;