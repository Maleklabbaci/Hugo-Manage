import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SearchIcon, XIcon, ProductsIcon, ShoppingCartIcon, HistoryIcon } from './Icons';

const GlobalSearch: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { products, sales, activityLog, t } = useAppContext();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus input on open
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const searchResults = useMemo(() => {
        if (!query.trim()) {
            return { products: [], sales: [], activityLog: [] };
        }

        const lowerCaseQuery = query.toLowerCase();

        const filteredProducts = products.filter(p =>
            p.name.toLowerCase().includes(lowerCaseQuery) ||
            p.category.toLowerCase().includes(lowerCaseQuery) ||
            p.supplier.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 5);

        const filteredSales = sales.filter(s =>
            s.productName.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 5);

        const filteredActivityLog = activityLog.filter(l =>
            l.productName.toLowerCase().includes(lowerCaseQuery) ||
            l.action.toLowerCase().includes(lowerCaseQuery) ||
            (l.details && l.details.toLowerCase().includes(lowerCaseQuery))
        ).slice(0, 5);

        return { products: filteredProducts, sales: filteredSales, activityLog: filteredActivityLog };
    }, [query, products, sales, activityLog]);
    
    const hasResults = searchResults.products.length > 0 || searchResults.sales.length > 0 || searchResults.activityLog.length > 0;

    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
    const modalVariants: Variants = {
        hidden: { y: "-50px", opacity: 0, scale: 0.95 },
        visible: { y: "0", opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-20 p-4"
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white dark:bg-secondary rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[70vh] flex flex-col"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b dark:border-slate-700 flex items-center">
                           <SearchIcon className="w-5 h-5 text-slate-400 me-3"/>
                           <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('search.placeholder')}
                                className="w-full bg-transparent text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                           />
                           <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon /></button>
                        </div>
                        <div className="overflow-y-auto">
                            {query.trim() && !hasResults && (
                                <div className="text-center p-16">
                                    <p className="text-slate-600 dark:text-slate-300 font-semibold">{t('search.no_results')}</p>
                                    <p className="text-sm text-slate-400">{t('search.results_for', {query})}</p>
                                </div>
                            )}
                            {hasResults && (
                                <div className="p-2">
                                    {searchResults.products.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="text-xs font-bold uppercase text-slate-400 px-3 py-2">{t('search.products')}</h3>
                                            <ul>{searchResults.products.map(p => (
                                                <li key={`prod-${p.id}`}><Link to="/products" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-dark">
                                                    <ProductsIcon className="w-5 h-5 text-cyan-500 me-4"/>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-white">{p.name}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{p.category}</p>
                                                    </div>
                                                </Link></li>
                                            ))}</ul>
                                        </div>
                                    )}
                                    {searchResults.sales.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="text-xs font-bold uppercase text-slate-400 px-3 py-2">{t('search.sales')}</h3>
                                            <ul>{searchResults.sales.map(s => (
                                                <li key={`sale-${s.id}`}><Link to="/sales" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-dark">
                                                    <ShoppingCartIcon className="w-5 h-5 text-green-500 me-4"/>
                                                     <div>
                                                        <p className="font-semibold text-slate-800 dark:text-white">{s.productName}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('search.sale_details', { quantity: s.quantity, price: s.totalPrice.toFixed(2) })}</p>
                                                    </div>
                                                </Link></li>
                                            ))}</ul>
                                        </div>
                                    )}
                                    {searchResults.activityLog.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="text-xs font-bold uppercase text-slate-400 px-3 py-2">{t('search.history')}</h3>
                                            <ul>{searchResults.activityLog.map(l => (
                                                <li key={`log-${l.id}`}><Link to="/history" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-dark">
                                                    <HistoryIcon className="w-5 h-5 text-amber-500 me-4"/>
                                                     <div>
                                                        <p className="font-semibold text-slate-800 dark:text-white">{l.productName}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{l.action}: {l.details || ''}</p>
                                                    </div>
                                                </Link></li>
                                            ))}</ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalSearch;
