import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderIcon, ChezHugoLogo } from './Icons';
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-[#0B1120]/30 backdrop-blur-xl">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <ChezHugoLogo />
                </div>
                
                <div className="h-6 mt-4">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="text-gray-600 dark:text-slate-400"
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