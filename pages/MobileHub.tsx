import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { ProductsIcon, CameraIcon, DashboardIcon, ChevronRightIcon } from '../components/Icons';

const MobileHub: React.FC = () => {
    const { t, user, openVisualSearch } = useAppContext();
    const navigate = useNavigate();

    // This is a safeguard in case a desktop user lands here.
    useEffect(() => {
        if (window.innerWidth >= 768) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSellOrDeliverClick = () => {
        openVisualSearch();
        // Navigate to a page within the Layout so the modal can be displayed
        navigate('/products');
    };

    const ActionButton: React.FC<{
        icon: React.ElementType;
        title: string;
        description: string;
        onClick: () => void;
        delay: number;
    }> = ({ icon: Icon, title, description, onClick, delay }) => (
        <motion.button
            onClick={onClick}
            className="w-full text-left p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-xl flex items-center space-x-4 transition-shadow hover:shadow-xl hover:shadow-cyan-500/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 + 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="p-3 bg-brand/10 rounded-full">
                <Icon className="w-6 h-6 text-brand-dark dark:text-brand-light" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
        </motion.button>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <motion.div
                className="w-full max-w-md text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-xl font-medium text-slate-600 dark:text-slate-300">
                    {t('mobile_hub.welcome', { email: user?.email || ' ' })}
                </h1>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 mb-8">
                    {t('mobile_hub.title')}
                </h2>
            </motion.div>

            <div className="w-full max-w-md space-y-4">
                <ActionButton
                    icon={ProductsIcon}
                    title={t('mobile_hub.manage_products_title')}
                    description={t('mobile_hub.manage_products_desc')}
                    onClick={() => navigate('/products')}
                    delay={1}
                />
                <ActionButton
                    icon={CameraIcon}
                    title={t('mobile_hub.sell_deliver_title')}
                    description={t('mobile_hub.sell_deliver_desc')}
                    onClick={handleSellOrDeliverClick}
                    delay={2}
                />
                <ActionButton
                    icon={DashboardIcon}
                    title={t('mobile_hub.enter_platform_title')}
                    description={t('mobile_hub.enter_platform_desc')}
                    onClick={() => navigate('/dashboard')}
                    delay={3}
                />
            </div>
        </div>
    );
};

export default MobileHub;