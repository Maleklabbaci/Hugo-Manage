import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

const LoadingScreen: React.FC = () => {
    const { t } = useAppContext();
    const [messageIndex, setMessageIndex] = useState(0);

    const messages = [
        t('loading.connecting'),
        t('loading.fetching_products'),
        t('loading.fetching_sales'),
        t('loading.building_dashboard'),
        t('loading.almost_ready'),
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-100/30 dark:bg-[#0B1120]/30 backdrop-blur-xl">
            <div className="text-center">
                 <svg className="w-16 h-16 text-cyan-400 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-white">Chez Hugo Manager</h1>
                
                <div className="h-6 mt-4">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="text-slate-500 dark:text-slate-400"
                        >
                            {messages[messageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <LoaderIcon className="w-6 h-6 animate-spin text-cyan-500 mx-auto mt-8" />
            </div>
        </div>
    );
};

export default LoadingScreen;