import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { XIcon, NotificationIcon, HistoryIcon, AlertCircleIcon, PackageXIcon, AddIcon, EditIcon, DeleteIcon, ShoppingCartIcon, UndoIcon, DeliveryIcon } from './Icons';
import type { Language, ActivityLog } from '../types';


const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const NotificationPanel: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { notifications, markAllNotificationsAsRead, t, activityLog, language } = useAppContext();
    const [activeTab, setActiveTab] = useState<'notifications' | 'history'>('notifications');
    const locale = localeMap[language];

    const formatTimestamp = (isoString: string) => {
      if (!isoString) return t('history.invalid_date');
      const date = new Date(isoString);
      return date.toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const getActionDetails = (log: ActivityLog) => {
        const details = {
            'created': { Icon: AddIcon, color: 'text-green-500', title: t('history.action.created', { productName: log.productName }) },
            'updated': { Icon: EditIcon, color: 'text-blue-500', title: t('history.action.updated', { productName: log.productName }) },
            'deleted': { Icon: DeleteIcon, color: 'text-red-500', title: t('history.action.deleted', { productName: log.productName }) },
            'sold': { Icon: ShoppingCartIcon, color: 'text-green-500', title: t('history.action.sold', { productName: log.productName }) },
            'sale_cancelled': { Icon: UndoIcon, color: 'text-amber-500', title: t('history.action.sale_cancelled', { productName: log.productName }) },
            'delivery_set': { Icon: DeliveryIcon, color: 'text-sky-500', title: t('history.action.delivery_set', { productName: log.productName }) },
            'delivery_cancelled': { Icon: UndoIcon, color: 'text-amber-500', title: t('history.action.delivery_cancelled', { productName: log.productName }) },
        };
        return details[log.action] || { Icon: EditIcon, color: 'text-slate-500', title: t('history.action.unknown') };
    };

    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
    const panelVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: -20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    };

    const TabButton: React.FC<{ tabId: 'notifications' | 'history', label: string, icon: React.ElementType, count: number }> = ({ tabId, label, icon: Icon, count }) => (
      <button
          onClick={() => setActiveTab(tabId)}
          className={`relative flex-1 flex items-center justify-center space-x-2 p-3 text-sm font-semibold transition-colors ${
              activeTab === tabId ? 'text-brand' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
      >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
          {count > 0 && <span className="text-xs bg-brand/20 text-brand-dark dark:text-brand-light font-bold px-2 py-0.5 rounded-full">{count}</span>}
          {activeTab === tabId && <motion.div layoutId="active-activity-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
      </button>
  );

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
                        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl flex flex-col max-h-[70vh]">
                            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{t('activity_center.title')}</h3>
                                <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"><XIcon/></button>
                            </header>

                             <div className="flex border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                                <TabButton tabId="notifications" label={t('activity_center.notifications_tab')} icon={NotificationIcon} count={notifications.length} />
                                <TabButton tabId="history" label={t('activity_center.history_tab')} icon={HistoryIcon} count={0} />
                             </div>
                            
                            <div className="overflow-y-auto">
                                {activeTab === 'notifications' && (
                                  <>
                                    {notifications.length > 0 ? (
                                        <ul className="divide-y divide-gray-200 dark:divide-white/10 p-2">
                                            {notifications.map(notification => (
                                                <li key={notification.id} className="flex items-start p-3">
                                                    <div className={`mt-0.5 ${notification.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                                                        {notification.type === 'error' ? <PackageXIcon className="w-5 h-5"/> : <AlertCircleIcon className="w-5 h-5"/>}
                                                    </div>
                                                    <div className="flex-1 mx-3">
                                                        <p className="text-sm text-gray-800 dark:text-slate-200">{notification.message}</p>
                                                    </div>
                                                </li>
                                            ))}
                                            <li className="p-2 text-center">
                                                <button onClick={markAllNotificationsAsRead} className="text-sm text-cyan-500 hover:text-cyan-400 font-medium">{t('notifications.clear_all')}</button>
                                            </li>
                                        </ul>
                                    ) : (
                                        <div className="text-center p-12 text-gray-500 dark:text-slate-400">
                                            <NotificationIcon className="w-10 h-10 mx-auto mb-2"/>
                                            <p className="font-medium">{t('notifications.empty')}</p>
                                        </div>
                                    )}
                                  </>
                                )}
                                {activeTab === 'history' && (
                                  <>
                                    {activityLog.length > 0 ? (
                                      <ul className="p-2">
                                          {activityLog.map(log => {
                                            const { Icon, color } = getActionDetails(log);
                                            return (
                                              <li key={log.id} className="flex items-start p-3 space-x-3">
                                                  <div className={`mt-0.5 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full ${color}`}><Icon className="w-4 h-4" /></div>
                                                  <div className="flex-1">
                                                      <p className="text-sm text-gray-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: t(`history.action.${log.action}`, { productName: `<strong class="font-semibold">${log.productName}</strong>` }) }} />
                                                      {log.details && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{log.details}</p>}
                                                  </div>
                                                  <p className="text-xs text-slate-500 dark:text-slate-500 flex-shrink-0">{formatTimestamp(log.createdAt)}</p>
                                              </li>
                                            );
                                          })}
                                      </ul>
                                    ) : (
                                      <div className="text-center p-12 text-gray-500 dark:text-slate-400">
                                        <HistoryIcon className="w-10 h-10 mx-auto mb-2"/>
                                        <p className="font-medium">{t('history.empty.title')}</p>
                                      </div>
                                    )}
                                  </>
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