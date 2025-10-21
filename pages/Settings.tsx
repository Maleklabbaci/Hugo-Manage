
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon, RefreshCwIcon } from '../components/Icons';
import type { Language, Theme } from '../types';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, resetData } = useAppContext();
  const { logout } = useAuth();
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }
  
  const handleResetData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.")) {
        resetData();
        alert("Les données ont été réinitialisées.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-800 dark:text-white">
      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">Thème</h3>
        <div className="flex items-center space-x-4">
          <p>Choisir le thème de l'application :</p>
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
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center"><LanguagesIcon className="w-5 h-5 mr-2"/> Langue</h3>
        <div className="flex items-center space-x-4">
            <p>Choisir la langue :</p>
            <select value={language} onChange={handleLanguageChange} className="bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
            </select>
        </div>
        <p className="text-xs text-slate-500 mt-2">Note: La traduction n'est pas implémentée.</p>
      </div>

      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center"><RefreshCwIcon className="w-5 h-5 mr-2"/> Gestion des données</h3>
        <button
          onClick={handleResetData}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors w-full"
        >
          Réinitialiser les données
        </button>
         <p className="text-xs text-slate-500 mt-2">Ceci rechargera les données de démonstration initiales.</p>
      </div>
      
      <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">Session</h3>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors w-full flex items-center justify-center"
        >
          <LogoutIcon className="w-5 h-5 mr-2"/>
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Settings;
