import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { XIcon, LoaderIcon } from './Icons';
import type { BulkUpdatePayload, BulkUpdateMode } from '../types';

interface BulkEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: BulkUpdatePayload) => Promise<void>;
  productCount: number;
}

const categories = ["Lunettes", "Montres", "Sacoches & Porte feuille", "Casquette", "Bracelet", "Ceintures", "Écharpes"];

const EditField: React.FC<{ isEnabled: boolean; onToggle: () => void; label: string; children: React.ReactNode }> = ({ isEnabled, onToggle, label, children }) => (
  <div className={`p-3 rounded-lg transition-colors ${isEnabled ? 'bg-cyan-500/10' : 'bg-gray-100 dark:bg-black/20'}`}>
    <div className="flex items-center mb-2">
      <input type="checkbox" checked={isEnabled} onChange={onToggle} className="w-4 h-4 text-cyan-500 bg-gray-200 border-gray-300 rounded focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 me-3 flex-shrink-0" />
      <label className="font-medium text-gray-700 dark:text-slate-200">{label}</label>
    </div>
    {isEnabled && <div className="ps-7 space-y-2">{children}</div>}
  </div>
);


const BulkEditForm: React.FC<BulkEditFormProps> = ({ isOpen, onClose, onSave, productCount }) => {
    const { t } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    // State for each field
    const [isCategoryEnabled, setIsCategoryEnabled] = useState(false);
    const [category, setCategory] = useState('');

    const [isSupplierEnabled, setIsSupplierEnabled] = useState(false);
    const [supplier, setSupplier] = useState('');

    const [isBuyPriceEnabled, setIsBuyPriceEnabled] = useState(false);
    const [buyPriceMode, setBuyPriceMode] = useState<BulkUpdateMode>('set');
    const [buyPriceValue, setBuyPriceValue] = useState(0);

    const [isSellPriceEnabled, setIsSellPriceEnabled] = useState(false);
    const [sellPriceMode, setSellPriceMode] = useState<BulkUpdateMode>('set');
    const [sellPriceValue, setSellPriceValue] = useState(0);

    const [isStockEnabled, setIsStockEnabled] = useState(false);
    const [stockMode, setStockMode] = useState<BulkUpdateMode>('set');
    const [stockValue, setStockValue] = useState(0);
    
    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(false);
            setIsCategoryEnabled(false); setCategory('');
            setIsSupplierEnabled(false); setSupplier('');
            setIsBuyPriceEnabled(false); setBuyPriceMode('set'); setBuyPriceValue(0);
            setIsSellPriceEnabled(false); setSellPriceMode('set'); setSellPriceValue(0);
            setIsStockEnabled(false); setStockMode('set'); setStockValue(0);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const updates: BulkUpdatePayload = {};
        if (isCategoryEnabled) updates.category = category;
        if (isSupplierEnabled) updates.supplier = supplier;
        if (isBuyPriceEnabled) updates.buyPrice = { mode: buyPriceMode, value: buyPriceValue };
        if (isSellPriceEnabled) updates.sellPrice = { mode: sellPriceMode, value: sellPriceValue };
        if (isStockEnabled) updates.stock = { mode: stockMode, value: stockValue };

        await onSave(updates);
        setIsLoading(false);
    };
  
    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 }};
    const modalVariants: Variants = {
        hidden: { y: "-100vh", opacity: 0 },
        visible: { y: "0", opacity: 1, transition: { delay: 0.1, type: 'spring', stiffness: 120 } },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants} onClick={onClose}
                >
                    <motion.div 
                        className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg relative p-8 max-h-[90vh] overflow-y-auto"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white"><XIcon /></button>
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('bulk_edit_form.title', { count: productCount })}</h2>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{t('bulk_edit_form.description')}</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <EditField isEnabled={isCategoryEnabled} onToggle={() => setIsCategoryEnabled(!isCategoryEnabled)} label={t('bulk_edit_form.category')}>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                                    <option value="" disabled>{t('product_form.select_category')}</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </EditField>
                            
                            <EditField isEnabled={isSupplierEnabled} onToggle={() => setIsSupplierEnabled(!isSupplierEnabled)} label={t('bulk_edit_form.supplier')}>
                                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                            </EditField>

                            <EditField isEnabled={isBuyPriceEnabled} onToggle={() => setIsBuyPriceEnabled(!isBuyPriceEnabled)} label={t('bulk_edit_form.buy_price')}>
                                <div className="flex items-center space-x-2">
                                    <select value={buyPriceMode} onChange={e => setBuyPriceMode(e.target.value as BulkUpdateMode)} className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                                        <option value="set">{t('bulk_edit_form.mode.set')}</option>
                                        <option value="increase">{t('bulk_edit_form.mode.increase')}</option>
                                        <option value="decrease">{t('bulk_edit_form.mode.decrease')}</option>
                                    </select>
                                    <input type="number" value={buyPriceValue} onChange={e => setBuyPriceValue(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-28 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                </div>
                            </EditField>

                            <EditField isEnabled={isSellPriceEnabled} onToggle={() => setIsSellPriceEnabled(!isSellPriceEnabled)} label={t('bulk_edit_form.sell_price')}>
                                 <div className="flex items-center space-x-2">
                                    <select value={sellPriceMode} onChange={e => setSellPriceMode(e.target.value as BulkUpdateMode)} className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                                        <option value="set">{t('bulk_edit_form.mode.set')}</option>
                                        <option value="increase">{t('bulk_edit_form.mode.increase')}</option>
                                        <option value="decrease">{t('bulk_edit_form.mode.decrease')}</option>
                                    </select>
                                    <input type="number" value={sellPriceValue} onChange={e => setSellPriceValue(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-28 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                </div>
                            </EditField>

                            <EditField isEnabled={isStockEnabled} onToggle={() => setIsStockEnabled(!isStockEnabled)} label={t('bulk_edit_form.stock')}>
                                 <div className="flex items-center space-x-2">
                                    <select value={stockMode} onChange={e => setStockMode(e.target.value as BulkUpdateMode)} className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                                        <option value="set">{t('bulk_edit_form.mode.set')}</option>
                                        <option value="increase">{t('bulk_edit_form.mode.increase')}</option>
                                        <option value="decrease">{t('bulk_edit_form.mode.decrease')}</option>
                                    </select>
                                    <input type="number" value={stockValue} onChange={e => setStockValue(parseInt(e.target.value) || 0)} min="0" step="1" className="w-28 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                </div>
                            </EditField>

                            <div className="flex justify-end pt-4 space-x-3">
                                <motion.button type="button" onClick={onClose} className="bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-lg px-4 py-2 font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t('cancel')}</motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center justify-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg px-4 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    {isLoading && <LoaderIcon className="animate-spin w-5 h-5 me-2" />}
                                    {t('bulk_edit_form.update_button', { count: productCount })}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BulkEditForm;
