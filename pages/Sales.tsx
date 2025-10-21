
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ShoppingCartIcon, UndoIcon } from '../components/Icons';
import type { Language } from '../types';

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const Sales: React.FC = () => {
    const { sales, cancelSale, t, language } = useAppContext();
    const locale = localeMap[language];

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
            <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                            <tr>
                                {tableHeaders.map(header => (
                                    <th key={header} scope="col" className="px-6 py-3">{t(`sales.table.${header}`)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale.id} className="bg-white dark:bg-secondary border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{sale.productName}</td>
                                    <td className="px-6 py-4">{sale.quantity}</td>
                                    <td className="px-6 py-4">{sale.sellPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</td>
                                    <td className="px-6 py-4 font-semibold">{sale.totalPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}</td>
                                    <td className="px-6 py-4 text-green-500 font-semibold">
                                        {(sale.totalMargin ?? 0).toLocaleString(locale, { style: 'currency', currency: 'DZD' })}
                                    </td>
                                    <td className="px-6 py-4">{formatTimestamp(sale.timestamp)}</td>
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
        </div>
    );
};

export default Sales;
