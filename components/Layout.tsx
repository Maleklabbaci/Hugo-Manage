import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from './GlobalSearch';
import NotificationPanel from './NotificationPanel';
import ConversationalAssistant from './ConversationalAssistant';
// FIX: Changed import to a named import to resolve module resolution error.
import { VisualSearchModal } from './VisualSearchModal';
import { useAppContext } from '../context/AppContext';
import { BotIcon } from './Icons';


const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const location = useLocation();
  const { isConfigured, t, session, isVisualSearchOpen, openVisualSearch, closeVisualSearch } = useAppContext();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <VisualSearchModal isOpen={isVisualSearchOpen} onClose={closeVisualSearch} />
      <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      {session && <ConversationalAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />}
      
      <div className="flex-1 flex flex-col overflow-hidden md:ms-64">
        <Header 
            onSearchClick={() => setIsSearchOpen(true)}
            onNotificationClick={() => setIsNotificationsOpen(prev => !prev)}
            onVisualSearchClick={openVisualSearch}
        />
        {!isConfigured && location.pathname !== '/settings' && (
            <div className="bg-amber-500/20 text-amber-700 dark:text-amber-300 p-3 text-center text-sm font-medium">
                {t('settings.supabase.unconfigured_prefix')}{' '}
                <Link to="/settings" className="font-bold underline hover:text-amber-600 dark:hover:text-amber-200">
                    {t('settings.supabase.unconfigured_link')}
                </Link>
            </div>
        )}
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

      {session && (
        <motion.button
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            aria-label={t('ai_assistant.title')}
        >
            <BotIcon className="w-7 h-7" />
        </motion.button>
      )}
    </div>
  );
};

export default Layout;