import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShoppingCartIcon, UndoIcon, DollarSignIcon, ArchiveIcon, TrendingUpIcon, ViewDetailsIcon, PiggyBankIcon } from '../components/Icons';
import type { Language, Sale, Product } from '../types';
import { motion } from 'framer-motion';
import ProductDetailsModal from '../components/ProductDetailsModal';
import StatCard from '../components/StatCard';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const SaleCard: React.FC<{ sale: Sale, onCancel: (id: number) => void, formatTimestamp: (iso: string) => string, onViewDetails: (p: Product) => void, product: Product | undefined }> = ({ sale, onCancel, formatTimestamp, onViewDetails, product }) => {
    const { t, language } = useAppContext();
    const locale = localeMap[language];
    return (
        <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{sale.productName}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{formatTimestamp(sale.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-2 -mt-1 -me-1">
                        {product && (
                             <motion.button 
                                onClick={() => onViewDetails(product)} 
                                className="p-2 rounded-full transition-colors bg-gray-500/10 hover:bg-gray-500/20 text-gray-500" 
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
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('sales.table.quantity')}</div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-1"><ArchiveIcon className="w-4 h-4"/><span>{sale.quantity}</span></div>
                    </div>
                     <div className="bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('sales.table.total_price')}</div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-1"><DollarSignIcon className="w-4 h-4"/><span>{sale.totalPrice.toFixed(0)}</span></div>
                    </div>
                     <div className="bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('sales.table.margin')}</div>
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

    const handleCancelSale = (saleId: number) => {
        if (window.confirm(t('sales.confirm_cancel'))) {
            cancelSale(saleId);
        }
    };

    if (sales.length === 0) {
        return (
            <div className="text-center py-10">
                <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('sales.empty.title')}</h2>
                <p className="text-gray-600 dark:text-slate-400">{t('sales.empty.subtitle')}</p>
            </div>
        )
    }
    
    const tableHeaders = ['product', 'quantity', 'unit_price', 'total_price', 'margin', 'date', 'actions'];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('sales.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard icon={DollarSignIcon} title={t('dashboard.sales_revenue')} value={`${salesStats.totalRevenue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
                <StatCard icon={PiggyBankIcon} title={t('dashboard.sales_profit')} value={`${salesStats.totalProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
                <StatCard icon={ShoppingCartIcon} title={t('dashboard.units_sold')} value={salesStats.unitsSold} />
            </div>

            {isMobile ? (
                <div className="grid grid-cols-1 gap-4">
                    {sales.map(sale => {
                        const product = products.find(p => p.id === sale.productId);
                        return <SaleCard key={sale.id} sale={sale} onCancel={handleCancelSale} formatTimestamp={formatTimestamp} onViewDetails={handleViewDetails} product={product} />
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-600 dark:text-slate-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-slate-300">
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
                                        <tr key={sale.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{sale.productName}</td>
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
                                                            className="p-2 rounded-md transition-colors bg-gray-500/10 hover:bg-gray-500/20 text-gray-500" 
                                                            title={t('product_details.view_button')}
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                            <ViewDetailsIcon className="w-5 h-5" />
                                                        </motion.button>
                                                    )}
                                                    <motion.button 
                                                        onClick={() => handleCancelSale(sale.id)} 
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
        </div>
    );
};

export default Sales;