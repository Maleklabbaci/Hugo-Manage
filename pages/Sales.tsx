import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShoppingCartIcon, UndoIcon, DollarSignIcon, ArchiveIcon, TrendingUpIcon } from '../components/Icons';
import type { Language, Sale } from '../types';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const SaleCard: React.FC<{ sale: Sale, onCancel: (id: number) => void, formatTimestamp: (iso: string) => string }> = ({ sale, onCancel, formatTimestamp }) => {
    const { t, language } = useAppContext();
    const locale = localeMap[language];
    return (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{sale.productName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatTimestamp(sale.createdAt)}</p>
                    </div>
                    <button onClick={() => onCancel(sale.id)} className="p-2 -mt-1 -me-1 rounded-full transition-colors bg-amber-500/10 hover:bg-amber-500/20 text-amber-500" title={t('sales.cancel_sale')}>
                        <UndoIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-black/20 p-2 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('sales.table.quantity')}</div>
                        <div className="font-semibold text-slate-800 dark:text-white flex items-center justify-center space-x-1"><ArchiveIcon className="w-4 h-4"/><span>{sale.quantity}</span></div>
                    </div>
                     <div className="bg-slate-50 dark:bg-black/20 p-2 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('sales.table.total_price')}</div>
                        <div className="font-semibold text-slate-800 dark:text-white flex items-center justify-center space-x-1"><DollarSignIcon className="w-4 h-4"/><span>{sale.totalPrice.toFixed(0)}</span></div>
                    </div>
                     <div className="bg-slate-50 dark:bg-black/20 p-2 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('sales.table.margin')}</div>
                        <div className="font-semibold text-green-500 flex items-center justify-center space-x-1"><TrendingUpIcon className="w-4 h-4"/><span>{(sale.totalMargin ?? 0).toFixed(0)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Sales: React.FC = () => {
    const { sales, cancelSale, t, language } = useAppContext();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const locale = localeMap[language];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formatTimestamp = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleCancelSale = (saleId: number) => {
        if (window.confirm(t('sales.confirm_delete'))) {
            cancelSale(saleId);
        }
    };

    if (sales.length === 0) {
        return (
            <div className="text-center py-10">
                <ShoppingCartIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('sales.empty.title')}</h2>
                <p className="text-slate-500 dark:text-slate-400">{t('sales.empty.subtitle')}</p>
            </div>
        )
    }
    
    const tableHeaders = ['product', 'quantity', 'unit_price', 'total_price', 'margin', 'date', 'actions'];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('sales.title')}</h2>
            {isMobile ? (
                <div className="grid grid-cols-1 gap-4">
                    {sales.map(sale => (
                        <SaleCard key={sale.id} sale={sale} onCancel={handleCancelSale} formatTimestamp={formatTimestamp} />
                    ))}
                </div>
            ) : (
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-white/10 dark:bg-white/5 dark:text-slate-300">
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header} scope="col" className="px-6 py-3">{t(`sales.table.${header}`)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="border-b border-white/20 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{sale.productName}</td>
                                        <td className="px-6 py-4">{sale.quantity}</td>
                                        <td className="px-6 py-4">{sale.sellPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</td>
                                        <td className="px-6 py-4 font-semibold">{sale.totalPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</td>
                                        <td className="px-6 py-4 text-green-500 font-semibold">
                                            {(sale.totalMargin ?? 0).toLocaleString(locale, { style: 'currency', currency: 'DZD' })}
                                        </td>
                                        <td className="px-6 py-4">{formatTimestamp(sale.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleCancelSale(sale.id)} 
                                                className="p-2 rounded-md transition-colors bg-amber-500/10 hover:bg-amber-500/20 text-amber-500" 
                                                title={t('sales.cancel_sale')}>
                                                <UndoIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;