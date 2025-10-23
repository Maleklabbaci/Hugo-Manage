import React from 'react';
import { useLocation } from 'react-router-dom';
import { SearchIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

const Header: React.FC<{ onSearchClick: () => void; }> = ({ onSearchClick }) => {
  const location = useLocation();
  const { t } = useAppContext();

  const getPageTitle = (pathname: string): string => {
    const key = 'header' + pathname.replace('/', '.');
    const title = t(key);
    // fallback for paths like /products/1
    if (title === key) {
        const baseKey = 'header.'+pathname.split('/')[1];
        const baseTitle = t(baseKey);
        if (baseTitle !== baseKey) return baseTitle;
        return t('header.default');
    }
    return title;
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="bg-white/80 dark:bg-black/30 backdrop-blur-lg sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center">
          <button onClick={onSearchClick} className="p-2 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            <SearchIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;