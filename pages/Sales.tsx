import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShoppingCartIcon, UndoIcon, DollarSignIcon, ArchiveIcon, TrendingUpIcon, ViewDetailsIcon, PiggyBankIcon } from '../components/Icons';
import type { Language, Sale, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ProductDetailsModal from '../components/ProductDetailsModal';
import StatCard from '../components/StatCard';
import ConfirmationModal from '../components/ConfirmationModal';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const SaleCard: React.FC<{ sale: Sale, onCancel: (id: number) => void, formatTimestamp: (iso: string) => string, onViewDetails: (p: Product) => void, product: Product | undefined }> = ({ sale, onCancel, formatTimestamp, onViewDetails, product }) => {
    const { t } = useAppContext();
    return (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-4 flex space-x-4 items-start">
            {product?.imageUrl ? (
                <img src={product.imageUrl} alt={sale.productName} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
            ) : (
                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCartIcon className="w-10 h-10 text-slate-400" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{sale.productName}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{formatTimestamp(sale.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0 -mt-1 -me-2">
                        {product && (
                             <motion.button 
                                onClick={() => onViewDetails(product)} 
                                className="p-2 rounded-full transition-colors bg-slate-500/10 hover:bg-slate-500/20 text-slate-500" 
                                title={t('product_details.view_button')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <ViewDetailsIcon className="w-5 h-5" />
                            </motion.button>
                        )}
                        <motion.button 
                            onClick={() => onCancel(sale.id)} 
                            className="p-2 rounded-full transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                            title={t('sales.cancel_sale')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <UndoIcon className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg">
                        <div className="text-xs text-slate-600 dark:text-slate-400">{t('sales.table.quantity')}</div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-center space-x-1"><ArchiveIcon className="w-4 h-4"/><span>{sale.quantity}</span></div>
                    </div>
                     <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg">
                        <div className="text-xs text-slate-600 dark:text-slate-400">{t('sales.table.total_price')}</div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-center space-x-1"><DollarSignIcon className="w-4 h-4"/><span>{sale.totalPrice.toFixed(0)}</span></div>
                    </div>
                     <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg">
                        <div className="text-xs text-slate-600 dark:text-slate-400">{t('sales.table.margin')}</div>
                        <div className="font-semibold text-green-600 dark:text-green-400 flex items-center justify-center space-x-1"><TrendingUpIcon className="w-4 h-4"/><span>{(sale.totalMargin ?? 0).toFixed(0)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Sales: React.FC = () => {
    const { sales, cancelSale, t, language, products } = useAppContext();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [productToShow, setProductToShow] = useState<Product | null>(null);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [saleToCancelId, setSaleToCancelId] = useState<number | null>(null);
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);

    const locale = localeMap[language];

    const salesStats = useMemo(() => {
        const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
        const totalProfit = sales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);
        const unitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
        return { totalRevenue, totalProfit, unitsSold };
    }, [sales]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleViewDetails = (product: Product) => {
        setProductToShow(product);
        setIsDetailsModalOpen(true);
    };

    const formatTimestamp = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleOpenCancelConfirm = (saleId: number) => {
        setSaleToCancelId(saleId);
        setIsCancelConfirmOpen(true);
    };

    const handleConfirmCancelSale = async () => {
        if (saleToCancelId) {
            await cancelSale(saleToCancelId);
        }
    };

    if (sales.length === 0) {
        return (
            <div className="text-center py-10">
                <ShoppingCartIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('sales.empty.title')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('sales.empty.subtitle')}</p>
            </div>
        )
    }
    
    const tableHeaders = ['image', 'product', 'quantity', 'unit_price', 'total_price', 'margin', 'date', 'actions'];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('sales.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard icon={DollarSignIcon} title={t('dashboard.sales_revenue')} value={`${salesStats.totalRevenue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
                <StatCard icon={PiggyBankIcon} title={t('dashboard.sales_profit')} value={`${salesStats.totalProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
                <StatCard icon={ShoppingCartIcon} title={t('dashboard.units_sold')} value={salesStats.unitsSold} />
            </div>

            {isMobile ? (
                <div className="grid grid-cols-1 gap-4">
                    {sales.map(sale => {
                        const product = products.find(p => p.id === sale.productId);
                        return <SaleCard key={sale.id} sale={sale} onCancel={handleOpenCancelConfirm} formatTimestamp={formatTimestamp} onViewDetails={handleViewDetails} product={product} />
                    })}
                </div>
            ) : (
                <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-slate-600 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300">
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header} scope="col" className="px-6 py-3">{t(`sales.table.${header}`)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => {
                                    const product = products.find(p => p.id === sale.productId);
                                    return (
                                        <tr key={sale.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                            <td className="px-6 py-4">
                                                {product?.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={sale.productName}
                                                        className="w-12 h-12 object-cover rounded-md cursor-pointer"
                                                        onMouseEnter={() => setHoveredImage(product.imageUrl)}
                                                        onMouseLeave={() => setHoveredImage(null)}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-md flex items-center justify-center">
                                                        <ShoppingCartIcon className="w-6 h-6 text-slate-400" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{sale.productName}</td>
                                            <td className="px-6 py-4">{sale.quantity}</td>
                                            <td className="px-6 py-4">{sale.sellPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</td>
                                            <td className="px-6 py-4 font-semibold">{sale.totalPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</td>
                                            <td className="px-6 py-4 text-green-600 dark:text-green-400 font-semibold">
                                                {(sale.totalMargin ?? 0).toLocaleString(locale, { style: 'currency', currency: 'DZD' })}
                                            </td>
                                            <td className="px-6 py-4">{formatTimestamp(sale.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    {product && (
                                                        <motion.button 
                                                            onClick={() => handleViewDetails(product)} 
                                                            className="p-2 rounded-md transition-colors bg-slate-500/10 hover:bg-slate-500/20 text-slate-500" 
                                                            title={t('product_details.view_button')}
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                            <ViewDetailsIcon className="w-5 h-5" />
                                                        </motion.button>
                                                    )}
                                                    <motion.button 
                                                        onClick={() => handleOpenCancelConfirm(sale.id)} 
                                                        className="p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                                                        title={t('sales.cancel_sale')}
                                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                        <UndoIcon className="w-5 h-5" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <ProductDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} product={productToShow} />
             <ConfirmationModal 
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                onConfirm={handleConfirmCancelSale}
                title={t('sales.confirm_cancel_title')}
                message={t('sales.confirm_cancel')}
            />
            <AnimatePresence>
                {hoveredImage && !isMobile && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.img
                            src={hoveredImage}
                            alt="Product Fullscreen"
                            className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sales;