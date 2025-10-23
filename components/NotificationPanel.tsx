import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { XIcon, NotificationIcon, AlertCircleIcon, PackageXIcon } from './Icons';

const NotificationPanel: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead, t } = useAppContext();
    
    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
    const panelVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: -20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 z-50"
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
                    onClick={onClose}
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        className="fixed top-20 right-4 md:right-8 w-full max-w-sm"
                        style={{ transformOrigin: 'top right' }}
                        variants={panelVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl flex flex-col max-h-[70vh]">
                            <div className="flex items-center justify-between p-4 border-b dark:border-white/10">
                                <h3 className="font-semibold text-slate-800 dark:text-white">{t('notifications.title')} ({notifications.length})</h3>
                                {notifications.length > 0 && (
                                    <button onClick={markAllNotificationsAsRead} className="text-sm text-cyan-500 hover:text-cyan-400 font-medium">{t('notifications.clear_all')}</button>
                                )}
                            </div>
                            <div className="overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <ul className="divide-y dark:divide-white/10 p-2">
                                        {notifications.map(notification => (
                                            <li key={notification.id} className="flex items-start p-3">
                                                <div className={`mt-1 ${notification.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                                                    {notification.type === 'error' ? <PackageXIcon className="w-5 h-5"/> : <AlertCircleIcon className="w-5 h-5"/>}
                                                </div>
                                                <div className="flex-1 mx-3">
                                                    <p className="text-sm text-slate-700 dark:text-slate-200">{notification.message}</p>
                                                </div>
                                                <button onClick={() => markNotificationAsRead(notification.id)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center p-12 text-slate-500 dark:text-slate-400">
                                        <NotificationIcon className="w-10 h-10 mx-auto mb-2"/>
                                        <p className="font-medium">{t('notifications.empty')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;