import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, description }) => {
  return (
    <motion.div
      className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 rounded-xl flex items-center space-x-3 md:space-x-4 md:p-6 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/20 hover:-translate-y-1"
      whileHover={{ scale: 1.02 }}
    >
      <div className="bg-cyan-100 dark:bg-cyan-500/20 p-2 md:p-3 rounded-full">
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-600 dark:text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">{title}</p>
        <p className="text-base md:text-2xl font-bold text-gray-900 dark:text-white break-words">{value}</p>
        {description && <p className="hidden md:block text-xs text-gray-500 dark:text-slate-500 truncate">{description}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;