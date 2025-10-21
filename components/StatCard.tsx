
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
      className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg flex items-center space-x-4 transition-all duration-300 hover:shadow-cyan-500/20 hover:-translate-y-1"
      whileHover={{ scale: 1.02 }}
    >
      <div className="bg-cyan-500/10 p-3 rounded-full">
        <Icon className="w-8 h-8 text-accent" />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
