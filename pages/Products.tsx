import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../types';
import ProductForm from '../components/ProductForm';
import SaleModal from '../components/SaleModal';
import { AddIcon, EditIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ProductsIcon, ShoppingCartIcon, DuplicateIcon, SearchIcon, MoreVerticalIcon, UploadIcon, LoaderIcon } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';

const calculateMargin = (product: Product) => {
  if (product.sellPrice <= 0) return '0.0';
  return (((product.sellPrice - product.buyPrice) / product.sellPrice) * 100).toFixed(1);
};

const ProductCard: React.FC<{ product: Product, onSelect: (id: number) => void, isSelected: boolean, onEdit: (p: Product) => void, onSell: (p: Product) => void, onDuplicate: (id: number) => void, onDelete: (id: number) => void }> = 
({ product, onSelect, isSelected, onEdit, onSell, onDuplicate, onDelete }) => {
  const { t } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const margin = useMemo(() => calculateMargin(product), [product]);

  return (
    <motion.div 
        layout
        className={`bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-200 relative ${isSelected ? 'ring-2 ring-cyan-500' : 'ring-1 ring-transparent'}`}
    >
      <div className="flex items-start p-4 space-x-4">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
        ) : (
          <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
            <ProductsIcon className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{product.category}</p>
              </div>
              <input 
                  type="checkbox"
                  className="w-5 h-5 text-cyan-500 bg-gray-100 border-gray-300 rounded-md focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-secondary focus:ring-2 dark:bg-slate-600 dark:border-slate-500 flex-shrink-0"
                  checked={isSelected}
                  onChange={() => onSelect(product.id)}
              />
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${product.status === 'actif' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {t(`products.status.${product.status === 'actif' ? 'active' : 'out_of_stock'}`)}
            </span>
            <p className="text-xs text-gray-500 dark:text-slate-500">Stock: {product.stock}</p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
           <div className="text-left">
             <div className="text-xs text-gray-600 dark:text-slate-400">{t('products.table.sell_price')}</div>
             <div className="font-semibold text-lg text-gray-900 dark:text-white">{product.sellPrice.toFixed(2)} DA</div>
           </div>
           <div className="text-right">
             <div className="text-xs text-gray-600 dark:text-slate-400">{t('products.table.margin')}</div>
             <div className={`font-semibold text-lg ${parseFloat(margin) > 0 ? 'text-green-500' : 'text-red-500'}`}>{margin}%</div>
           </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
           <motion.button 
             onClick={() => onSell(product)} 
             className="flex-1 text-white bg-gradient-to-r from-cyan-500 to-blue-500 disabled:from-slate-400 disabled:to-slate-500 rounded-lg h-10 font-semibold text-sm disabled:opacity-70 flex items-center justify-center" 
             disabled={product.stock === 0}
             whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }}
             whileTap={{ scale: 0.95 }}
             transition={{ type: 'spring', stiffness: 400, damping: 17 }}
           >
             <ShoppingCartIcon className="w-4 h-4 me-2"/> {t('sell')}
           </motion.button>
           <div className="relative">
             <button onClick={() => setMenuOpen(!menuOpen)} onBlur={() => setTimeout(() => setMenuOpen(false), 100)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/20">
               <MoreVerticalIcon className="w-5 h-5"/>
             </button>
             <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-12 right-0 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg shadow-lg w-40 z-10 overflow-hidden"
                >
                  <button onClick={() => { onEdit(product); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50"><EditIcon className="w-4 h-4 me-2"/> {t('edit')}</button>
                  <button onClick={() => { onDuplicate(product.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50"><DuplicateIcon className="w-4 h-4 me-2"/> {t('duplicate')}</button>
                  <div className="h-px bg-gray-200 dark:bg-white/10 my-1"></div>
                  <button onClick={() => { onDelete(product.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center text-red-500 hover:bg-red-500/10"><DeleteIcon className="w-4 h-4 me-2"/> {t('delete')}</button>
                </motion.div>
              )}
             </AnimatePresence>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct, addSale, t, addMultipleProducts } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [productToSell, setProductToSell] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const productsPerPage = 30;
  
  const timeAgo = (isoDate: string): string => {
    if (!isoDate) return '-';
    const seconds = Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return t('products.time_ago.now');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('products.time_ago.minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('products.time_ago.hours', { count: hours });
    const days = Math.floor(hours / 24);
    return t('products.time_ago.days', { count: days });
  };
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
        return products;
    }
    return products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedProducts([]);
  }, [currentPage, products, searchQuery]);

  const handleOpenModal = (product?: Product) => {
    setProductToEdit(product || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'| 'status' | 'createdAt' | 'updatedAt'> | Product) => {
    let result: Product | null;
    if ('id' in productData) {
      result = await updateProduct(productData as Product);
    } else {
      result = await addProduct(productData);
    }

    if (result) {
      handleCloseModal();
    }
  };
  
  const handleDelete = (productId: number) => {
    if (window.confirm(t('products.confirm_delete'))) {
        deleteProduct(productId);
    }
  }

  const handleOpenSaleModal = (product: Product) => {
    setProductToSell(product);
    setIsSaleModalOpen(true);
  };

  const handleCloseSaleModal = () => {
      setIsSaleModalOpen(false);
      setProductToSell(null);
  };

  const handleConfirmSale = (productId: number, quantity: number) => {
      addSale(productId, quantity);
      handleCloseSaleModal();
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSelectOne = (productId: number) => {
    setSelectedProducts(prev => 
        prev.includes(productId) 
            ? prev.filter(id => id !== productId) 
            : [...prev, productId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedProducts(paginatedProducts.map(p => p.id));
    } else {
        setSelectedProducts([]);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(t('products.confirm_delete_multiple', { count: selectedProducts.length }))) {
        deleteMultipleProducts(selectedProducts);
        setSelectedProducts([]);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/);
            const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            const requiredColumns = ['Handle', 'Title', 'Product Category', 'Variant Price', 'Variant SKU', 'Image Src'];
            const missingColumns: string[] = [];
            const colIndices: Record<string, number> = {};
            requiredColumns.forEach(col => {
                const index = header.indexOf(col);
                if (index === -1) {
                    missingColumns.push(col);
                }
                colIndices[col] = index;
            });
            if (missingColumns.length > 0) {
              throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
            }

            const newProducts: Omit<Product, 'id' | 'status' | 'createdAt'>[] = [];
            const processedHandles = new Set<string>();
            const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i]) continue;
                const data = lines[i].split(csvRegex).map(d => d.trim().replace(/^"|"$/g, ''));
                
                const handle = data[colIndices['Handle']];
                if (handle && !processedHandles.has(handle)) {
                    processedHandles.add(handle);
                    
                    const name = data[colIndices['Title']];
                    const category = data[colIndices['Product Category']];
                    const sellPriceStr = data[colIndices['Variant Price']];
                    const stockStr = data[colIndices['Variant SKU']] || '';
                    const imageUrl = data[colIndices['Image Src']];

                    const sellPrice = parseFloat(sellPriceStr);
                    const stock = parseInt(stockStr.replace(/'/g, ''), 10);
                    
                    if (name && !isNaN(sellPrice)) {
                        newProducts.push({
                            name,
                            category: category || t('products.uncategorized'),
                            supplier: 'Shopify',
                            buyPrice: 0,
                            sellPrice,
                            stock: !isNaN(stock) ? stock : 0,
                            imageUrl: imageUrl || undefined,
                        });
                    }
                }
            }

            if (newProducts.length > 0) {
                await addMultipleProducts(newProducts);
                alert(t('products.import.success', { count: newProducts.length }));
            } else {
                alert(t('products.import.error_no_products_found'));
            }
        } catch (error) {
            console.error("Import error:", error);
            if ((error as Error).message.startsWith('Missing columns')) {
                alert(t('products.import.error_format', { columns: (error as Error).message.replace('Missing columns: ', '') }));
            } else {
                alert(t('products.import.error_file'));
            }
        } finally {
            setIsImporting(false);
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  const numSelected = selectedProducts.length;
  const numOnPage = paginatedProducts.length;
  const isAllSelected = numSelected === numOnPage && numOnPage > 0;

  const tableHeaderKeys = ["image", "name", "category", "buy_price", "sell_price", "stock", "margin", "status", "last_updated", "actions"];

  return (
    <div className="pb-16 md:pb-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products.title')}</h2>
        <div className="flex items-center space-x-2">
            <motion.button
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center bg-white dark:bg-white/10 text-gray-700 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/20 font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isImporting ? <LoaderIcon className="w-5 h-5 me-2 animate-spin" /> : <UploadIcon className="w-5 h-5 me-2" />}
                <span className="hidden sm:inline">{t('products.import_shopify')}</span>
            </motion.button>
            <motion.button
              onClick={() => handleOpenModal()}
              className="flex items-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg px-4 py-2"
              whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <AddIcon className="w-5 h-5 me-2" />
              <span className="hidden sm:inline">{t('products.add_product')}</span>
            </motion.button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
      </div>

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('products.search_placeholder')}
            className="w-full ps-10 pr-4 py-2 bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>

      {numSelected > 0 && !isMobile && (
        <div className="bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 p-3 rounded-lg mb-4 flex items-center justify-between shadow-md">
            <span className="font-semibold">{t('products.selected_text', { count: numSelected })}</span>
            <motion.button
                onClick={handleBulkDelete}
                className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg px-3 py-1.5 text-sm"
                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
                <DeleteIcon className="w-4 h-4 me-2" />
                {t('products.delete_selected')}
            </motion.button>
        </div>
      )}

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {paginatedProducts.map(p => (
            <ProductCard 
              key={p.id}
              product={p}
              isSelected={selectedProducts.includes(p.id)}
              onSelect={handleSelectOne}
              onEdit={handleOpenModal}
              onSell={handleOpenSaleModal}
              onDuplicate={duplicateProduct}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-600 dark:text-slate-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th scope="col" className="p-4">
                      <div className="flex items-center">
                          <input 
                            id="checkbox-all-search" 
                            type="checkbox" 
                            className="w-4 h-4 text-cyan-500 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                          <label htmlFor="checkbox-all-search" className="sr-only">checkbox</label>
                      </div>
                  </th>
                  {tableHeaderKeys.map(key => (
                    <th key={key} scope="col" className="px-6 py-3">{t(`products.table.${key}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length > 0 ? paginatedProducts.map(product => (
                  <tr key={product.id} className={`border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 ${selectedProducts.includes(product.id) ? 'bg-cyan-500/10' : ''}`}>
                    <td className="w-4 p-4">
                          <div className="flex items-center">
                              <input 
                                id={`checkbox-table-search-${product.id}`}
                                type="checkbox"
                                className="w-4 h-4 text-cyan-500 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleSelectOne(product.id)}
                              />
                              <label htmlFor={`checkbox-table-search-${product.id}`} className="sr-only">checkbox</label>
                          </div>
                      </td>
                    <td className="px-6 py-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700/50 rounded-md flex items-center justify-center">
                          <ProductsIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4">{product.buyPrice.toFixed(2)} DA</td>
                    <td className="px-6 py-4">{product.sellPrice.toFixed(2)} DA</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">{calculateMargin(product)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.status === 'actif' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {t(`products.status.${product.status === 'actif' ? 'active' : 'out_of_stock'}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">{timeAgo(product.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                          <motion.button 
                              onClick={() => handleOpenSaleModal(product)} 
                              className="p-2 rounded-md transition-colors bg-green-500/10 hover:bg-green-500/20 text-green-500 disabled:bg-slate-500/10 disabled:text-slate-500 disabled:cursor-not-allowed"
                              disabled={product.stock === 0}
                              title={t('sell')}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          >
                              <ShoppingCartIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button 
                              onClick={() => handleOpenModal(product)} 
                              className="p-2 rounded-md transition-colors bg-blue-500/10 hover:bg-blue-500/20 text-blue-500" 
                              title={t('edit')}
                               whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          >
                              <EditIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button 
                              onClick={() => duplicateProduct(product.id)}
                              className="p-2 rounded-md transition-colors bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                              title={t('duplicate')}
                               whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          >
                              <DuplicateIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button 
                              onClick={() => handleDelete(product.id)} 
                              className="p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                              title={t('delete')}
                               whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          >
                              <DeleteIcon className="w-5 h-5" />
                          </motion.button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                      <td colSpan={tableHeaderKeys.length + 2} className="text-center py-10">
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">{t('products.no_results_title')}</h3>
                          <p className="text-gray-600 dark:text-slate-400">{t('products.no_results_subtitle')}</p>
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-gray-100 dark:enabled:hover:bg-white/10">
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-slate-300"/>
            </button>
            <span className="mx-4 text-gray-700 dark:text-slate-200">{t('products.pagination', { currentPage, totalPages })}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-gray-100 dark:enabled:hover:bg-white/10">
                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-slate-300"/>
            </button>
        </div>
      )}

      <AnimatePresence>
        {isMobile && numSelected > 0 && (
          <motion.div
            className="fixed bottom-20 left-4 right-4 z-10 bg-slate-900/80 backdrop-blur-lg border border-white/10 p-3 rounded-xl shadow-lg flex items-center justify-between"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
          >
            <span className="font-semibold text-white">{t('products.selected_text', { count: numSelected })}</span>
            <motion.button
              onClick={handleBulkDelete}
              className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg px-3 py-1.5 text-sm"
              whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <DeleteIcon className="w-4 h-4 me-2" />
              {t('products.delete_selected')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductForm isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} productToEdit={productToEdit} />
      <SaleModal isOpen={isSaleModalOpen} onClose={handleCloseSaleModal} onConfirm={handleConfirmSale} product={productToSell} />
    </div>
  );
};

export default Products;