import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { getDashboardInsights } from '../services/gemini';
import type { AIInsight } from '../types';
import { LightbulbIcon, LoaderIcon, TrendingUpIcon, TrendingDownIcon, AlertCircleIcon, SparklesIcon } from './Icons';

const AIInsights: React.FC = () => {
    const { t, products, sales } = useAppContext();
    const [insights, setInsights] = useState<AIInsight[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setInsights(null);
        try {
            const result = await getDashboardInsights(products, sales);
            if (result) {
                setInsights(result);
            } else {
                setError(t('dashboard.ai_insights.error'));
            }
        } catch (e) {
            setError(t('dashboard.ai_insights.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const InsightIcon: React.FC<{ type: AIInsight['type'] }> = ({ type }) => {
        switch (type) {
            case 'positive':
                return <TrendingUpIcon className="w-5 h-5 text-green-500" />;
            case 'negative':
                return <TrendingDownIcon className="w-5 h-5 text-red-500" />;
            case 'neutral':
                return <AlertCircleIcon className="w-5 h-5 text-blue-500" />;
            default:
                return <LightbulbIcon className="w-5 h-5 text-amber-500" />;
        }
    };

    return (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-4 md:p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <LightbulbIcon className="w-6 h-6 me-3 text-amber-500" />
                    {t('dashboard.ai_insights.title')}
                </h3>
                <motion.button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center text-white bg-gradient-to-r from-brand to-blue-500 font-semibold rounded-lg px-4 py-2 mt-3 sm:mt-0 disabled:opacity-70 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                    {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 me-2" /> : <SparklesIcon className="w-5 h-5 me-2" />}
                    {isLoading ? t('dashboard.ai_insights.generating') : t('dashboard.ai_insights.generate_button')}
                </motion.button>
            </div>
            
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="flex items-center justify-center p-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <LoaderIcon className="w-8 h-8 animate-spin text-cyan-500" />
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        className="bg-red-500/10 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {error}
                    </motion.div>
                )}
                {insights && (
                    <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
                    >
                        {insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg flex items-start space-x-3"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <div className="flex-shrink-0 pt-0.5">
                                    <InsightIcon type={insight.type} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{insight.title}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{insight.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIInsights;