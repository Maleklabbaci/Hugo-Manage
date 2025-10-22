import React, { useState, useEffect, useRef } from 'react';
import type { Product } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon, UploadIcon, DeleteIcon, LoaderIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'created_at' | 'owner_id' | 'status'> | Product) => void;
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
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (productToEdit) {
      const { imageUrl, ...rest } = productToEdit;
      setFormData({
        ...rest,
        imageUrl: imageUrl || '',
      });
      setImagePreview(imageUrl || null);
    } else {
      setFormData({ name: '', category: '', supplier: '', buyPrice: 0, sellPrice: 0, stock: 0, imageUrl: '' });
      setImagePreview(null);
    }
    setImageFile(null); // Reset file on open
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let finalImageUrl = formData.imageUrl;

    try {
      if (imageFile) {
        const uploadResponse = await api.uploadImage(imageFile);
        // Assuming the Xano response for an image upload has a 'url' property.
        finalImageUrl = uploadResponse.url; 
      }

      const finalProductData = { ...formData, imageUrl: finalImageUrl || undefined };

      if (productToEdit) {
          onSave({ ...productToEdit, ...finalProductData });
      } else {
          onSave(finalProductData);
      }
    } catch (error) {
        console.error("Failed to upload image or save product", error);
        alert("Error uploading image. Please try again.");
    } finally {
        setIsUploading(false);
    }
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
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent" required />
                        </div>
                        
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.category_label')}</label>
                            <select 
                                id="category" 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent" 
                                required
                            >
                                <option value="" disabled>{t('product_form.select_category')}</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.image_label')}</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-dark flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                                ) : (
                                    <UploadIcon className="w-8 h-8 text-slate-400" />
                                )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        ref={fileInputRef}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full mb-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-sm"
                                    >
                                        {t('product_form.change_image')}
                                    </button>
                                    {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="w-full bg-red-500/10 text-red-500 rounded-lg px-4 py-2 hover:bg-red-500/20 transition-colors text-sm"
                                    >
                                        {t('product_form.remove_image')}
                                    </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label htmlFor="supplier" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.supplier_label')}</label>
                                <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent" required />
                            </div>
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.stock_label')}</label>
                                <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent" required min="0" step="1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="buyPrice" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.buy_price_label')}</label>
                                <input type="number" id="buyPrice" name="buyPrice" value={formData.buyPrice} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent" required min="0" step="0.01" />
                            </div>
                            <div>
                                <label htmlFor="sellPrice" className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-1">{t('product_form.sell_price_label')}</label>
                                <input type="number" id="sellPrice" name="sellPrice" value={formData.sellPrice} onChange={handleChange} className="w-full bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent" required min="0" step="0.01" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">{t('cancel')}</button>
                            <button type="submit" disabled={isUploading} className="bg-accent hover:bg-accent-hover text-dark font-semibold rounded-lg px-4 py-2 transition-colors flex items-center justify-center disabled:opacity-50">
                                {isUploading && <LoaderIcon className="w-5 h-5 me-2 animate-spin"/>}
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