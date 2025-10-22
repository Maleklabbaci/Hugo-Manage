import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AddIcon, EditIcon, DeleteIcon, ShoppingCartIcon, UndoIcon } from '../components/Icons';
import { motion } from 'framer-motion';
import type { ActivityLog, Language } from '../types';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const History: React.FC = () => {
  const { activityLog, t, language } = useAppContext();
  const locale = localeMap[language];

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionDetails = (log: ActivityLog) => {
    switch (log.action) {
      case 'created':
        return {
          Icon: AddIcon,
          color: 'text-green-500',
          title: t('history.action.created', { productName: log.product_name }),
        };
      case 'updated':
        return {
          Icon: EditIcon,
          color: 'text-blue-500',
          title: t('history.action.updated', { productName: log.product_name }),
        };
      case 'deleted':
        return {
          Icon: DeleteIcon,
          color: 'text-red-500',
          title: t('history.action.deleted', { productName: log.product_name }),
        };
      case 'sold':
        return {
          Icon: ShoppingCartIcon,
          color: 'text-green-500',
          title: t('history.action.sold', { productName: log.product_name }),
        };
      case 'sale_cancelled':
        return {
          Icon: UndoIcon,
          color: 'text-amber-500',
          title: t('history.action.sale_cancelled', { productName: log.product_name }),
        };
      default:
        return {
          Icon: EditIcon,
          color: 'text-slate-500',
          title: t('history.action.unknown'),
        };
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  
  if (activityLog.length === 0) {
    return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{t('history.empty.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400">{t('history.empty.subtitle')}</p>
        </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('history.title')}</h2>
      <motion.div 
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {activityLog.map(log => {
          const { Icon, color, title } = getActionDetails(log);
          return (
            <motion.div 
              key={log.id} 
              className="bg-white dark:bg-secondary p-4 rounded-lg shadow-md flex items-start space-x-4"
              variants={itemVariants}
            >
              <div className={`mt-1 p-2 bg-slate-100 dark:bg-dark rounded-full ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">{title}</p>
                {log.details && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('history.details')} : {log.details}</p>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatTimestamp(log.timestamp)}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default History;