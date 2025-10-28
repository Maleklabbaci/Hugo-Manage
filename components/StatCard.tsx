import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
  trend?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, description, trend }) => {
  return (
    <motion.div
      className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-start space-x-3 md:space-x-4 md:p-6 transition-shadow,border-color duration-300 hover:shadow-xl hover:shadow-cyan-500/5"
      whileHover={{ scale: 1.02 }}
    >
      <div className="bg-brand/10 p-2 md:p-3 rounded-full">
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-brand-dark dark:text-brand-light" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <div className="flex items-baseline space-x-2">
            <p className="text-base md:text-2xl font-bold text-slate-800 dark:text-slate-100 break-words">{value}</p>
            {trend}
        </div>
        {description && <p className="hidden md:block text-xs text-slate-500 dark:text-slate-500 truncate">{description}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;