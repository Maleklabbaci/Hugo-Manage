import React, { useState, useEffect } from 'react';
import type { Product, ProductFormData } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon, LoaderIcon, SparklesIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { generateProductInfo } from '../services/gemini';


interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData | (Product & { productData: ProductFormData })) => Promise<void>;
  productToEdit?: Product | null;
  initialData?: (ProductFormData & { imageBlob?: Blob }) | null;
}


const categories = ["Lunettes", "Montres", "Sacoches & Porte feuille", "Casquette", "Bracelet", "Ceintures", "Écharpes"];

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSave, productToEdit, initialData }) => {
  const { t } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        description: productToEdit.description || '',
        category: productToEdit.category,
        supplier: productToEdit.supplier,
        buyPrice: productToEdit.buyPrice,
        sellPrice: productToEdit.sellPrice,
        stock: productToEdit.stock,
      });
      setImagePreview(productToEdit.imageUrl || null);
    } else if (initialData) {
        const { imageBlob, ...formDataFromAI } = initialData;
        // FIX: Ensure the object passed to setFormData matches the state shape and types.
        setFormData({
            name: formDataFromAI.name,
            description: formDataFromAI.description || '',
            category: formDataFromAI.category,
            supplier: formDataFromAI.supplier,
            buyPrice: formDataFromAI.buyPrice,
            sellPrice: formDataFromAI.sellPrice,
            stock: formDataFromAI.stock,
        });
        if (imageBlob) {
            const file = new File([imageBlob], "scanned-product.jpg", { type: imageBlob.type });
            setImageFile(file);
            setImagePreview(URL.createObjectURL(imageBlob));
        }
    } else {
      setFormData({ name: '', description: '', category: '', supplier: '', buyPrice: 0, sellPrice: 0, stock: 0 });
    }
    
    if (!initialData) {
        setImageFile(null);
    }
    if (!productToEdit && !initialData) {
        setImagePreview(null);
    }

  }, [productToEdit, initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isNumber = type === 'number';
    setFormData(prev => ({
      ...prev,
      [name]: isNumber ? parseFloat(value) || 0 : value,
    }));
  };
  

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!formData.name || !formData.category) {
        alert(t('product_form.error_generation_fields'));
        return;
    }
    setIsGenerating(true);
    const result = await generateProductInfo(formData.name, formData.category, formData.supplier);
    if (result) {
        setFormData(prev => ({
            ...prev,
            name: result.name,
            description: result.description,
        }));
    } else {
        alert(t('product_form.error_generation_api'));
    }
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const finalProductData: ProductFormData = { 
        ...formData,
        imageUrl: productToEdit?.imageUrl,
        imageFile: imageFile 
    };

    if (productToEdit) {
        await onSave({ ...productToEdit, productData: finalProductData });
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
    hidden: { y: "-50px", opacity: 0, scale: 0.95 },
    visible: { y: "0", opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } },
  };

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
                    className="bg-white/95 dark:bg-slate-800/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-lg relative p-8 max-h-[90vh] overflow-y-auto"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                        <XIcon />
                    </button>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{productToEdit ? t('product_form.edit_title') : t('product_form.add_title')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div className="relative">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.name_label')}</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand" required />
                            <motion.button 
                                type="button" 
                                onClick={handleGenerate} 
                                disabled={isGenerating}
                                className="absolute top-7 right-2 flex items-center px-2 py-1 text-xs font-semibold text-brand-dark dark:text-brand-light bg-brand/10 dark:bg-brand/20 rounded-full disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isGenerating ? <LoaderIcon className="w-4 h-4 animate-spin me-1"/> : <SparklesIcon className="w-4 h-4 me-1"/>}
                                {isGenerating ? t('product_form.generating') : t('product_form.generate_with_ai')}
                            </motion.button>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.description')}</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand"></textarea>
                        </div>
                        
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.category_label')}</label>
                            <select 
                                id="category" 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand" 
                                required
                            >
                                <option value="" disabled>{t('product_form.select_category')}</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.image_label')}</label>
                            <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand-dark dark:file:text-brand-light hover:file:bg-brand/20" />
                        </div>
                        {imagePreview && (
                            <div className="my-4 flex justify-center">
                                <img src={imagePreview} alt="Aperçu du produit" className="w-32 h-32 object-cover rounded-lg" />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label htmlFor="supplier" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.supplier_label')}</label>
                                <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand" required />
                            </div>
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.stock_label')}</label>
                                <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand" required min="0" step="1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="buyPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.buy_price_label')}</label>
                                <input type="number" id="buyPrice" name="buyPrice" value={formData.buyPrice} onChange={handleChange} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand" required min="0" step="0.01" />
                            </div>
                            <div>
                                <label htmlFor="sellPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('product_form.sell_price_label')}</label>
                                <input type="number" id="sellPrice" name="sellPrice" value={formData.sellPrice} onChange={handleChange} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand" required min="0" step="0.01" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                className="bg-slate-200 dark:bg-slate-700/50 text-slate-800 dark:text-white rounded-lg px-4 py-2 font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('cancel')}
                            </motion.button>
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center text-white bg-gradient-to-r from-brand to-blue-500 font-semibold rounded-lg px-4 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                                {isLoading && <LoaderIcon className="animate-spin w-5 h-5 me-2" />}
                                {t('save')}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default ProductForm;
