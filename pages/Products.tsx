import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../types';
import ProductForm from '../components/ProductForm';
import SaleModal from '../components/SaleModal';
import { AddIcon, EditIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ProductsIcon, ShoppingCartIcon, DuplicateIcon } from '../components/Icons';

const calculateMargin = (product: Product) => {
  if (product.sellPrice === 0) return 0;
  return (((product.sellPrice - product.buyPrice) / product.sellPrice) * 100).toFixed(1);
};

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct, addSale } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [productToSell, setProductToSell] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const productsPerPage = 30;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [products, currentPage]);

  useEffect(() => {
    setSelectedProducts([]);
  }, [currentPage, products]);

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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
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

  const totalPages = Math.ceil(products.length / productsPerPage);

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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer les ${selectedProducts.length} produits sélectionnés ?`)) {
        deleteMultipleProducts(selectedProducts);
        setSelectedProducts([]);
    }
  };

  const numSelected = selectedProducts.length;
  const numOnPage = paginatedProducts.length;
  const isAllSelected = numSelected === numOnPage && numOnPage > 0;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Liste des produits</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-accent hover:bg-accent-hover text-dark font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          <AddIcon className="w-5 h-5 mr-2" />
          Ajouter produit
        </button>
      </div>

      {numSelected > 0 && (
        <div className="bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 p-3 rounded-lg mb-4 flex items-center justify-between shadow-md">
            <span className="font-semibold">{numSelected} produit(s) sélectionné(s)</span>
            <button
                onClick={handleBulkDelete}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
                <DeleteIcon className="w-4 h-4 mr-2" />
                Supprimer
            </button>
        </div>
      )}

      <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
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
                {["Image", "Nom", "Catégorie", "Prix achat", "Prix vente", "Stock", "Marge (%)", "Statut", "Actions"].map(header => (
                  <th key={header} scope="col" className="px-6 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => (
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
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => handleOpenSaleModal(product)} 
                            className="p-2 rounded-md transition-colors bg-green-500/10 hover:bg-green-500/20 text-green-500 disabled:bg-slate-500/10 disabled:text-slate-500 disabled:cursor-not-allowed"
                            disabled={product.stock === 0}
                            title="Vendre"
                        >
                            <ShoppingCartIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleOpenModal(product)} 
                            className="p-2 rounded-md transition-colors bg-blue-500/10 hover:bg-blue-500/20 text-blue-500" 
                            title="Modifier"
                        >
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => duplicateProduct(product.id)}
                            className="p-2 rounded-md transition-colors bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                            title="Dupliquer"
                        >
                            <DuplicateIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleDelete(product.id)} 
                            className="p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                            title="Supprimer"
                        >
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-secondary">
                <ChevronLeftIcon className="w-5 h-5 text-slate-500 dark:text-slate-300"/>
            </button>
            <span className="mx-4 text-slate-700 dark:text-slate-200">Page {currentPage} sur {totalPages}</span>
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