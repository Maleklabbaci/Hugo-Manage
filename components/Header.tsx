import React from 'react';
import { useLocation } from 'react-router-dom';
import { SearchIcon, NotificationIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

const Header: React.FC<{ onSearchClick: () => void; onNotificationClick: () => void; }> = ({ onSearchClick, onNotificationClick }) => {
  const location = useLocation();
  const { t, notifications } = useAppContext();

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
  const notificationCount = notifications.length;

  return (
    <header className="bg-white/80 dark:bg-black/30 backdrop-blur-lg sticky top-0 z-20 border-b border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button 
            onClick={onSearchClick} 
            className="p-2 rounded-full text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SearchIcon className="w-6 h-6" />
          </motion.button>
          <motion.button 
            onClick={onNotificationClick} 
            className="p-2 rounded-full text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10 relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <NotificationIcon className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-red-500 text-white font-bold border-2 border-white dark:border-gray-50">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;