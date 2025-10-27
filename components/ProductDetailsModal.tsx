import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon, ProductsIcon } from './Icons';
import { Product } from '../types';
import { useAppContext } from '../context/AppContext';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const DetailItem: React.FC<{ label: string; value: string | number | React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
);

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose, product }) => {
    const { t, deliveries } = useAppContext();

    const backdropVariants: Variants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    const modalVariants: Variants = {
        hidden: { y: "50px", opacity: 0, scale: 0.95 },
        visible: { y: "0", opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } },
    };

    if (!product) return null;

    const isDelivery = deliveries.some(d => d.productId === product.id);

    let statusText: string;
    let statusColor: string;

    if (isDelivery) {
        statusText = t('products.status.delivery');
        statusColor = 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300';
    } else {
        const statusKey = product.status;
        statusText = t(`products.status.${statusKey}`);
        statusColor = product.status === 'actif'
            ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
    }


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={backdropVariants}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg relative p-6 max-h-[90vh] overflow-y-auto"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white">
                            <XIcon />
                        </button>
                        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                             {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full sm:w-32 h-32 object-cover rounded-lg flex-shrink-0" />
                            ) : (
                                <div className="w-full sm:w-32 h-32 bg-gray-200 dark:bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ProductsIcon className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
                                <p className="text-md text-gray-600 dark:text-slate-400">{product.category}</p>
                            </div>
                        </div>
                        
                        {product.description && (
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 mb-1">{t('product_details.description')}</h3>
                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
                            <DetailItem label={t('product_form.supplier_label')} value={product.supplier} />
                             <DetailItem label={t('products.table.status')} value={<span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusText}</span>} />
                            <DetailItem label={t('product_form.buy_price_label')} value={`${product.buyPrice.toFixed(2)} DA`} />
                            <DetailItem label={t('product_form.sell_price_label')} value={`${product.sellPrice.toFixed(2)} DA`} />
                            <DetailItem label={t('product_form.stock_label')} value={`${product.stock} ${t('dashboard.chart.units')}`} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProductDetailsModal;
