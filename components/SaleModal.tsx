import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: number, quantity: number) => void;
  product: Product | null;
  title: string;
  confirmText: string;
  quantityLabel: string;
}

const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, onConfirm, product, title, confirmText, quantityLabel }) => {
    const { t } = useAppContext();
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setError('');
        }
    }, [isOpen]);

    if (!product) return null;

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < 1) {
            setQuantity(1);
            setError('');
        } else if (value > product.stock) {
            setQuantity(product.stock);
            setError(t('sale_modal.error.not_enough_stock', { stock: product.stock }));
        } else {
            setQuantity(value);
            setError('');
        }
    };
    
    const handleSubmit = () => {
        if (quantity > 0 && quantity <= product.stock) {
            onConfirm(product.id, quantity);
            onClose();
        } else {
            setError(t('sale_modal.error.invalid_quantity'));
        }
    };

    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 }};
    const modalVariants: Variants = {
        hidden: { y: "-50px", opacity: 0 },
        visible: { y: "0", opacity: 1, transition: { type: 'spring', stiffness: 150 } },
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
                    onClick={onClose}
                >
                    <motion.div 
                        className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md relative p-8"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white"><XIcon /></button>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
                        <p className="text-gray-700 dark:text-slate-300">{t('sale_modal.product')}: <span className="font-semibold">{product.name}</span></p>
                        <p className="text-gray-700 dark:text-slate-300 mb-6">{t('sale_modal.available_stock')}: <span className="font-semibold">{product.stock}</span></p>

                        <div className="space-y-4">
                             <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">{quantityLabel}</label>
                                <input 
                                    type="number" id="quantity" name="quantity" 
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                                    required min="1" max={product.stock} step="1" 
                                />
                                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 space-x-3">
                            <motion.button type="button" onClick={onClose} className="bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-lg px-4 py-2 font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t('cancel')}</motion.button>
                            <motion.button onClick={handleSubmit} className="text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg px-4 py-2" whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>{confirmText}</motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SaleModal;