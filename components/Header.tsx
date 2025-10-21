import React from 'react';
import { useLocation } from 'react-router-dom';
import { MenuIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
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
    <header className="bg-white dark:bg-secondary shadow-md sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <button onClick={onMenuClick} className="md:hidden text-slate-500 dark:text-slate-300">
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h1>
        <div>
          {/* Future user avatar or actions here */}
        </div>
      </div>
    </header>
  );
};

export default Header;