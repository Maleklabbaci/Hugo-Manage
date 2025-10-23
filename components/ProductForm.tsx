import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon, LoaderIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'status' | 'updatedAt'> | Product) => Promise<void>;
  productToEdit?: Product | null;
}

const categories = ["Lunettes", "Montres", "Sacoches & Porte feuille", "Casquette", "Bracelet"];

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
  const { t } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplier: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        category: productToEdit.category,
        supplier: productToEdit.supplier,
        buyPrice: productToEdit.buyPrice,
        sellPrice: productToEdit.sellPrice,
        stock: productToEdit.stock,
      });
      if (productToEdit.imageUrl) {
        setImagePreview(productToEdit.imageUrl);
        setImageData(productToEdit.imageUrl);
      } else {
        setImagePreview(null);
        setImageData(null);
      }
    } else {
      setFormData({ name: '', category: '', supplier: '', buyPrice: 0, sellPrice: 0, stock: 0 });
      setImagePreview(null);
      setImageData(null);
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setImageData(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const finalProductData = { ...formData, imageUrl: imageData || undefined };

    if (productToEdit) {
        await onSave({ ...productToEdit, ...finalProductData });
    } else {
        await onSave(finalProductData);
    }
    setIsLoading(false);
  };
  
  const backdropVariants: Variants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants: Variants = {
    hidden: { y: "-100vh", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { delay: 0.1, type: 'spring', stiffness: 120 } },
  };

  return (
    <AnimatePresence>
        {isOpen && (
            <motion.div 
                className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={backdropVariants}
                onClick={onClose}
            >
                <motion.div 
                    className="bg-white dark:bg-secondary rounded-2xl shadow-xl w-full max-w-lg relative p-8 max-h-[90vh] overflow-y-auto"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                        <XIcon />
                    </button>
                    <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{productToEdit ? t('product_form.edit_title') : t('product_form.add_title')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.name_label')}</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" required />
                        </div>
                        
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.category_label')}</label>
                            <select 
                                id="category" 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                                required
                            >
                                <option value="" disabled>{t('product_form.select_category')}</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.image_label')}</label>
                            <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20" />
                        </div>
                        {imagePreview && (
                            <div className="my-4 flex justify-center">
                                <img src={imagePreview} alt="Aperçu du produit" className="w-32 h-32 object-cover rounded-lg" />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label htmlFor="supplier" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.supplier_label')}</label>
                                <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" required />
                            </div>
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.stock_label')}</label>
                                <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" required min="0" step="1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="buyPrice" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.buy_price_label')}</label>
                                <input type="number" id="buyPrice" name="buyPrice" value={formData.buyPrice} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" required min="0" step="0.01" />
                            </div>
                            <div>
                                <label htmlFor="sellPrice" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.sell_price_label')}</label>
                                <input type="number" id="sellPrice" name="sellPrice" value={formData.sellPrice} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" required min="0" step="0.01" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-500 transform transition-all duration-200 hover:-translate-y-0.5">{t('cancel')}</button>
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="flex items-center justify-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50 hover:-translate-y-0.5 transform transition-all duration-200 font-semibold rounded-lg px-4 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading && <LoaderIcon className="animate-spin w-5 h-5 me-2" />}
                                {t('save')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default ProductForm;
