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
      className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-4 rounded-xl flex items-center space-x-3 md:space-x-4 md:p-6 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/20 hover:-translate-y-1"
      whileHover={{ scale: 1.02 }}
    >
      <div className="bg-cyan-500/10 p-2 md:p-3 rounded-full">
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-500" />
      </div>
      <div>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        {description && <p className="hidden md:block text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;