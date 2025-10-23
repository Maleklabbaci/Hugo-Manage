import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon, DatabaseIcon, UploadIcon, DownloadIcon, RefreshCwIcon } from '../components/Icons';
import type { Language, Theme } from '../types';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t, products, sales, activityLog, importData, exportData, resetData } = useAppContext();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }

  const handleExport = () => {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `chez-hugo-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (window.confirm(t('settings.confirm_import_text'))) {
              const reader = new FileReader();
              reader.onload = async (event) => {
                  try {
                      const content = event.target?.result as string;
                      await importData(content);
                      alert(t('settings.import_success'));
                  } catch (err) {
                      console.error(err);
                      alert(t('settings.import_error_format'));
                  }
              };
              reader.onerror = () => {
                  alert(t('settings.import_error_read'));
              }
              reader.readAsText(file);
          }
      }
      if(e.target) e.target.value = '';
  };

  const handleReset = () => {
      if (window.confirm(t('settings.confirm_reset_text'))) {
          resetData();
      }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-800 dark:text-white">
      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.theme_title')}</h3>
        <div className="flex items-center space-x-4">
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
      
      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center"><LanguagesIcon className="w-5 h-5 me-2"/> {t('settings.language_title')}</h3>
        <div className="flex items-center space-x-4">
            <p>{t('settings.language_select')}</p>
            <select value={language} onChange={handleLanguageChange} className="bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-cyan-500 focus:border-cyan-500">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
            </select>
        </div>
      </div>

       <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center">
              <DatabaseIcon className="w-5 h-5 me-2"/> {t('settings.data_title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('settings.data_stats', { products: products.length, sales: sales.length, activities: activityLog.length })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                  onClick={handleExport}
                  className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg px-4 py-2 transform transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5"
              >
                  <DownloadIcon className="w-5 h-5 me-2"/>
                  {t('settings.data_export')}
              </button>
              <button
                  onClick={handleImportClick}
                  className="flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg px-4 py-2 transform transition-all duration-200 hover:shadow-lg hover:shadow-green-500/50 hover:-translate-y-0.5"
              >
                  <UploadIcon className="w-5 h-5 me-2"/>
                  {t('settings.data_import')}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
              <button
                  onClick={handleReset}
                  className="flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg px-4 py-2 transform transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
              >
                  <RefreshCwIcon className="w-5 h-5 me-2"/>
                  {t('settings.data_reset')}
              </button>
          </div>
      </div>

      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.session_title')}</h3>
        <button
          onClick={logout}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg px-4 py-2 w-full flex items-center justify-center transform transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-0.5"
        >
          <LogoutIcon className="w-5 h-5 me-2"/>
          {t('settings.logout_button')}
        </button>
      </div>
    </div>
  );
};

export default Settings;