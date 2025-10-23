import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { ServerIcon } from './Icons';
import GlobalSearch from './GlobalSearch';
import NotificationPanel from './NotificationPanel';

const SupabaseBanner = () => {
    const { t } = useAppContext();
    return (
        <div className="bg-amber-100 dark:bg-amber-900/40 backdrop-blur-md text-amber-800 dark:text-amber-300 p-3 text-sm text-center flex items-center justify-center border-b border-amber-300/50">
            <ServerIcon className="w-5 h-5 me-3 flex-shrink-0" />
            <span className="font-medium">{t('settings.supabase.unconfigured_prefix')}</span>
            <Link to="/settings" className="font-bold underline ms-1 hover:text-amber-600 dark:hover:text-amber-200">
                {t('settings.supabase.unconfigured_link')}
            </Link>
        </div>
    )
}

const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  const { isConfigured } = useAppContext();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden md:ms-64">
        <Header 
            onSearchClick={() => setIsSearchOpen(true)}
            onNotificationClick={() => setIsNotificationsOpen(prev => !prev)}
        />
        {!isConfigured && <SupabaseBanner />}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;