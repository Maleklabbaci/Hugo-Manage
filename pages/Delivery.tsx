import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product, Language } from '../types';
import { DeliveryIcon, MarkDeliveredIcon, ProductsIcon, UndoIcon, ViewDetailsIcon, DollarSignIcon } from '../components/Icons';
import { motion } from 'framer-motion';
import ProductDetailsModal from '../components/ProductDetailsModal';
import StatCard from '../components/StatCard';
import ConfirmationModal from '../components/ConfirmationModal';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA',
};

const DeliveryCard: React.FC<{ product: Product, onConfirmSale: (product: Product) => void, onCancel: (id: number) => void, onViewDetails: (product: Product) => void }> = ({ product, onConfirmSale, onCancel, onViewDetails }) => {
    const { t, language } = useAppContext();
    const locale = localeMap[language];

    const formatTimestamp = (isoDate: string): string => {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <motion.div
            layout
            className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden"
        >
            <div className="flex items-start p-4 space-x-4">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                    <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <ProductsIcon className="w-10 h-10 text-gray-400" />
                    </div>
                )}
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{product.category}</p>
                    <div className="flex items-baseline space-x-4 mt-2">
                        <p className="font-semibold text-lg text-gray-900 dark:text-white">{product.sellPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{t('products.table.stock')}: <span className="font-semibold">{product.stock}</span></p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{t('delivery.table.delivered_at')}: {formatTimestamp(product.createdAt)}</p>
                </div>
            </div>
            <div className="px-4 pb-4 flex items-center space-x-2 justify-between">
                <motion.button
                    onClick={() => onConfirmSale(product)}
                    className="flex-1 flex items-center justify-center text-white bg-gradient-to-r from-green-500 to-emerald-500 font-semibold rounded-lg h-10"
                    whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                    <MarkDeliveredIcon className="w-5 h-5 me-2" />
                    {t('delivery.confirm_sale')}
                </motion.button>
                <div className="flex items-center space-x-2">
                    <motion.button
                        onClick={() => onViewDetails(product)}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-300 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={t('product_details.view_button')}
                    >
                        <ViewDetailsIcon className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        onClick={() => onCancel(product.id)}
                        className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={t('delivery.cancel_delivery')}
                    >
                        <UndoIcon className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};


const Delivery: React.FC = () => {
    const { products, confirmSaleFromDelivery, cancelDelivery, t, language } = useAppContext();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [productToShow, setProductToShow] = useState<Product | null>(null);
    const [isConfirmSaleOpen, setIsConfirmSaleOpen] = useState(false);
    const [productToConfirmSale, setProductToConfirmSale] = useState<Product | null>(null);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [deliveryToCancelId, setDeliveryToCancelId] = useState<number | null>(null);
    const locale = localeMap[language];

    const deliveryProducts = useMemo(() => {
        const filtered = products.filter(p => p.status === 'en livraison');
        return filtered.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();

            if (isNaN(timeA) && isNaN(timeB)) return 0;
            if (isNaN(timeA)) return 1; // Invalid dates go to the end
            if (isNaN(timeB)) return -1;
            
            return timeB - timeA; // Sort descending
        });
    }, [products]);

    const deliveryStats = useMemo(() => {
        const totalItems = deliveryProducts.reduce((acc, p) => acc + p.stock, 0);
        const totalValue = deliveryProducts.reduce((acc, p) => acc + (p.stock * p.sellPrice), 0);
        return { totalItems, totalValue };
    }, [deliveryProducts]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleViewDetails = (product: Product) => {
        setProductToShow(product);
        setIsDetailsModalOpen(true);
    };

    const handleOpenCancelConfirm = (productId: number) => {
        setDeliveryToCancelId(productId);
        setIsCancelConfirmOpen(true);
    };
    
    const handleConfirmCancelDelivery = async () => {
        if (deliveryToCancelId) {
            await cancelDelivery(deliveryToCancelId);
        }
    };
    
    const handleOpenConfirmSale = (product: Product) => {
        setProductToConfirmSale(product);
        setIsConfirmSaleOpen(true);
    };

    const handleConfirmSaleAction = async () => {
        if (productToConfirmSale) {
            await confirmSaleFromDelivery(productToConfirmSale.id);
        }
    };

    const timeAgo = (isoDate: string): string => {
        if (!isoDate) return '-';
        const seconds = Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / 1000);
        if (seconds < 60) return t('products.time_ago.now');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('products.time_ago.minutes', { count: minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('products.time_ago.hours', { count: hours });
        const days = Math.floor(hours / 24);
        return t('products.time_ago.days', { count: days });
    };

    const formatDate = (isoDate: string) => {
      if (!isoDate) return '-';
      return new Date(isoDate).toLocaleDateString(localeMap[language], { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (deliveryProducts.length === 0) {
        return (
            <div className="text-center py-10">
                <DeliveryIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('delivery.empty.title')}</h2>
                <p className="text-gray-600 dark:text-slate-400">{t('delivery.empty.subtitle')}</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('delivery.title')} ({deliveryProducts.length})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StatCard icon={DeliveryIcon} title={t('delivery.total_items')} value={deliveryStats.totalItems} />
                <StatCard icon={DollarSignIcon} title={t('delivery.total_value')} value={`${deliveryStats.totalValue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
            </div>

            {isMobile ? (
                <div className="grid grid-cols-1 gap-4">
                    {deliveryProducts.map(p => (
                        <DeliveryCard key={p.id} product={p} onConfirmSale={handleOpenConfirmSale} onCancel={handleOpenCancelConfirm} onViewDetails={handleViewDetails} />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-600 dark:text-slate-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('products.table.image')}</th>
                                    <th scope="col" className="px-6 py-3">{t('products.table.name')}</th>
                                    <th scope="col" className="px-6 py-3">{t('products.table.category')}</th>
                                    <th scope="col" className="px-6 py-3">{t('products.table.sell_price')}</th>
                                    <th scope="col" className="px-6 py-3">{t('products.table.stock')}</th>
                                    <th scope="col" className="px-6 py-3">{t('delivery.table.delivered_at')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveryProducts.map(product => (
                                    <tr key={product.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700/50 rounded-md flex items-center justify-center">
                                                    <ProductsIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{product.name}</td>
                                        <td className="px-6 py-4">{product.category}</td>
                                        <td className="px-6 py-4 font-semibold">{product.sellPrice.toLocaleString(localeMap[language], { style: 'currency', currency: 'DZD' })}</td>
                                        <td className="px-6 py-4 font-semibold">{product.stock}</td>
                                        <td className="px-6 py-4 text-xs whitespace-nowrap" title={timeAgo(product.createdAt)}>
                                            {formatDate(product.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <motion.button
                                                    onClick={() => handleOpenConfirmSale(product)}
                                                    className="flex items-center text-white bg-gradient-to-r from-green-500 to-emerald-500 font-semibold rounded-lg px-3 py-2 text-sm"
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                >
                                                    <MarkDeliveredIcon className="w-4 h-4 me-2" />
                                                    {t('delivery.confirm_sale')}
                                                </motion.button>
                                                 <motion.button
                                                    onClick={() => handleViewDetails(product)}
                                                    className="p-2 rounded-md transition-colors bg-gray-500/10 hover:bg-gray-500/20 text-gray-500"
                                                    title={t('product_details.view_button')}
                                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                    <ViewDetailsIcon className="w-5 h-5" />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleOpenCancelConfirm(product.id)}
                                                    className="p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500"
                                                    title={t('delivery.cancel_delivery')}
                                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                    <UndoIcon className="w-5 h-5" />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <ProductDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} product={productToShow} />
            <ConfirmationModal 
                isOpen={isConfirmSaleOpen}
                onClose={() => {
                    setIsConfirmSaleOpen(false);
                    setProductToConfirmSale(null);
                }}
                onConfirm={handleConfirmSaleAction}
                title={t('delivery.confirm_sale_title')}
                message={productToConfirmSale ? t('delivery.confirm_sale_message', { productName: productToConfirmSale.name }) : ''}
                confirmText={t('delivery.confirm_sale')}
            />
            <ConfirmationModal 
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                onConfirm={handleConfirmCancelDelivery}
                title={t('delivery.confirm_cancel_title')}
                message={t('delivery.confirm_cancel')}
            />
        </div>
    );
};

export default Delivery;