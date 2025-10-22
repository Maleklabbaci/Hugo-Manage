import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../types';
import ProductForm from '../components/ProductForm';
import SaleModal from '../components/SaleModal';
import { AddIcon, EditIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ProductsIcon, ShoppingCartIcon, DuplicateIcon, SearchIcon } from '../components/Icons';

const calculateMargin = (product: Product) => {
  if (product.sellPrice === 0) return 0;
  return (((product.sellPrice - product.buyPrice) / product.sellPrice) * 100).toFixed(1);
};

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct, addSale, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [productToSell, setProductToSell] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const productsPerPage = 30;

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  const timeAgo = (isoDate: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return t('products.time_ago.now');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('products.time_ago.minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('products.time_ago.hours', { count: hours });
    const days = Math.floor(hours / 24);
    return t('products.time_ago.days', { count: days });
  };

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

  const handleSaveProduct = (productData: Omit<Product, 'id'| 'status' | 'updatedAt'> | Product) => {
    if ('id' in productData) {
      updateProduct(productData as Product);
    } else {
      addProduct(productData);
    }
    handleCloseModal();
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

  const numSelected = selectedProducts.length;
  const numOnPage = paginatedProducts.length;
  const isAllSelected = numSelected === numOnPage && numOnPage > 0;

  const tableHeaders = ["Image", "Nom", "Catégorie", "Prix achat", "Prix vente", "Stock", "Marge (%)", "Statut", "Dernière modif.", "Actions"];
  const tableHeaderKeys = ["image", "name", "category", "buy_price", "sell_price", "stock", "margin", "status", "last_updated", "actions"];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('products.title')}</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-accent hover:bg-accent-hover text-dark font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          <AddIcon className="w-5 h-5 me-2" />
          {t('products.add_product')}
        </button>
      </div>

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
        </div>
        <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('products.search_placeholder')}
            className="w-full ps-10 pr-4 py-2 bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent"
        />
      </div>

      {numSelected > 0 && (
        <div className="bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 p-3 rounded-lg mb-4 flex items-center justify-between shadow-md">
            <span className="font-semibold">{t('products.selected_text', { count: numSelected })}</span>
            <button
                onClick={handleBulkDelete}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
                <DeleteIcon className="w-4 h-4 me-2" />
                {t('products.delete_selected')}
            </button>
        </div>
      )}

      <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th scope="col" className="p-4">
                    <div className="flex items-center">
                        <input 
                          id="checkbox-all-search" 
                          type="checkbox" 
                          className="w-4 h-4 text-accent bg-slate-100 border-slate-300 rounded focus:ring-accent dark:focus:ring-accent dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
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
                <tr key={product.id} className={`bg-white dark:bg-secondary border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedProducts.includes(product.id) ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}`}>
                   <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input 
                              id={`checkbox-table-search-${product.id}`}
                              type="checkbox"
                              className="w-4 h-4 text-accent bg-slate-100 border-slate-300 rounded focus:ring-accent dark:focus:ring-accent dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
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
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center">
                        <ProductsIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.buyPrice.toFixed(2)} DA</td>
                  <td className="px-6 py-4">{product.sellPrice.toFixed(2)} DA</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">{calculateMargin(product)}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.status === 'actif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {t(`products.status.${product.status === 'actif' ? 'active' : 'out_of_stock'}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs whitespace-nowrap">{timeAgo(product.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => handleOpenSaleModal(product)} 
                            className="p-2 rounded-md transition-colors bg-green-500/10 hover:bg-green-500/20 text-green-500 disabled:bg-slate-500/10 disabled:text-slate-500 disabled:cursor-not-allowed"
                            disabled={product.stock === 0}
                            title={t('sell')}
                        >
                            <ShoppingCartIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleOpenModal(product)} 
                            className="p-2 rounded-md transition-colors bg-blue-500/10 hover:bg-blue-500/20 text-blue-500" 
                            title={t('edit')}
                        >
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => duplicateProduct(product.id)}
                            className="p-2 rounded-md transition-colors bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                            title={t('duplicate')}
                        >
                            <DuplicateIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleDelete(product.id)} 
                            className="p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                            title={t('delete')}
                        >
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={tableHeaderKeys.length + 2} className="text-center py-10">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{t('products.no_results_title')}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{t('products.no_results_subtitle')}</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-secondary">
                <ChevronLeftIcon className="w-5 h-5 text-slate-500 dark:text-slate-300"/>
            </button>
            <span className="mx-4 text-slate-700 dark:text-slate-200">{t('products.pagination', { currentPage, totalPages })}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-secondary">
                <ChevronRightIcon className="w-5 h-5 text-slate-500 dark:text-slate-300"/>
            </button>
        </div>
      )}

      <ProductForm isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} productToEdit={productToEdit} />
      <SaleModal isOpen={isSaleModalOpen} onClose={handleCloseSaleModal} onConfirm={handleConfirmSale} product={productToSell} />
    </>
  );
};

export default Products;