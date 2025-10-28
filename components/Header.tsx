import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchIcon, NotificationIcon, RefreshCwIcon, LoaderIcon, CameraIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

const Header: React.FC<{ onSearchClick: () => void; onNotificationClick: () => void; onVisualSearchClick: () => void; }> = ({ onSearchClick, onNotificationClick, onVisualSearchClick }) => {
  const location = useLocation();
  const { t, notifications, refetchData, isLoading } = useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'border-b border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/10 dark:shadow-black/20' : 'border-b border-transparent'}`}>
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button 
            onClick={() => refetchData && refetchData()}
            disabled={isLoading}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60 disabled:cursor-wait"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={t('header.refresh_data')}
            aria-label={t('header.refresh_data')}
          >
            {isLoading ? <LoaderIcon className="w-6 h-6 animate-spin" /> : <RefreshCwIcon className="w-6 h-6" />}
          </motion.button>
          <motion.button 
            onClick={onSearchClick} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={t('search.placeholder')}
          >
            <SearchIcon className="w-6 h-6" />
          </motion.button>
          <motion.button 
            onClick={onVisualSearchClick} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={t('visual_search.title')}
          >
            <CameraIcon className="w-6 h-6" />
          </motion.button>
          <motion.button 
            onClick={onNotificationClick} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60 relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <NotificationIcon className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-red-500 text-white font-bold border-2 border-slate-100 dark:border-slate-900">
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