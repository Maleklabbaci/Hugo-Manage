import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../types';
import ProductForm from '../components/ProductForm';
import { AddIcon, EditIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ProductsIcon } from '../components/Icons';

const calculateMargin = (product: Product) => {
  if (product.sellPrice === 0) return 0;
  return (((product.sellPrice - product.buyPrice) / product.sellPrice) * 100).toFixed(1);
};

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

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

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [products, currentPage]);

  const totalPages = Math.ceil(products.length / productsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

      <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                {["Image", "Nom", "Catégorie", "Prix achat", "Prix vente", "Stock", "Marge (%)", "Statut", "Actions"].map(header => (
                  <th key={header} scope="col" className="px-6 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => (
                <tr key={product.id} className="bg-white dark:bg-secondary border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => handleOpenModal(product)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700"><DeleteIcon className="w-5 h-5" /></button>
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
    </>
  );
};

export default Products;