import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AddIcon, EditIcon, DeleteIcon, ShoppingCartIcon, UndoIcon, DeliveryIcon, LoaderIcon } from '../components/Icons';
import { motion } from 'framer-motion';
import type { ActivityLog, Language } from '../types';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const History: React.FC = () => {
  const { activityLog, t, language, isLoading } = useAppContext();
  const locale = localeMap[language];

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-96">
              <LoaderIcon className="w-10 h-10 animate-spin text-cyan-500" />
          </div>
      );
  }

  const formatTimestamp = (isoString: string) => {
    if (!isoString) return t('history.invalid_date');
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return t('history.invalid_date');
    }
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
          title: t('history.action.created', { productName: log.productName }),
        };
      case 'updated':
        return {
          Icon: EditIcon,
          color: 'text-blue-500',
          title: t('history.action.updated', { productName: log.productName }),
        };
      case 'deleted':
        return {
          Icon: DeleteIcon,
          color: 'text-red-500',
          title: t('history.action.deleted', { productName: log.productName }),
        };
      case 'sold':
        return {
          Icon: ShoppingCartIcon,
          color: 'text-green-500',
          title: t('history.action.sold', { productName: log.productName }),
        };
      case 'sale_cancelled':
        return {
          Icon: UndoIcon,
          color: 'text-amber-500',
          title: t('history.action.sale_cancelled', { productName: log.productName }),
        };
      case 'delivery_set':
        return {
          Icon: DeliveryIcon,
          color: 'text-sky-500',
          title: t('history.action.delivery_set', { productName: log.productName }),
        };
      case 'delivery_cancelled':
        return {
          Icon: UndoIcon,
          color: 'text-amber-500',
          title: t('history.action.delivery_cancelled', { productName: log.productName }),
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('history.empty.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400">{t('history.empty.subtitle')}</p>
        </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('history.title')}</h2>
      <motion.div 
        className="relative space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700/50 sm:left-7"></div>
        {activityLog.map(log => {
          const { Icon, color, title } = getActionDetails(log);
          return (
             <motion.div 
                key={log.id} 
                className="relative flex items-start space-x-4 pl-12 sm:pl-14"
                variants={itemVariants}
            >
                <div className={`absolute left-0 top-1.5 p-2 bg-slate-100 dark:bg-slate-900 rounded-full ${color} ring-4 ring-slate-100 dark:ring-slate-900`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-4 rounded-lg w-full">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div className="flex-1 mb-1 sm:mb-0">
                            <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                            {log.details && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('history.details')} : {log.details}</p>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap sm:ms-4 flex-shrink-0">{formatTimestamp(log.createdAt)}</p>
                    </div>
                </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default History;