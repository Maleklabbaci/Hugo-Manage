
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Product, Theme, Language } from '../types';
import { storage } from '../services/storage';
import { MOCK_PRODUCTS } from '../mock/products';


interface AppContextType {
  products: Product[];
  theme: Theme;
  language: Language;
  addProduct: (product: Omit<Product, 'id' | 'status' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(storage.loadProducts());
  const [theme, setThemeState] = useState<Theme>(storage.getTheme());
  const [language, setLanguageState] = useState<Language>(storage.getLanguage());

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);
  
  const addProduct = useCallback((productData: Omit<Product, 'id' | 'status' | 'updatedAt'>) => {
    setProducts(prevProducts => {
      const newProduct: Product = {
        ...productData,
        id: prevProducts.length > 0 ? Math.max(...prevProducts.map(p => p.id)) + 1 : 1,
        status: productData.stock > 0 ? 'actif' : 'rupture',
        updatedAt: new Date().toISOString(),
      };
      const updatedProducts = [...prevProducts, newProduct];
      storage.saveProducts(updatedProducts);
      return updatedProducts;
    });
  }, []);

  // FIX: Refactored to explicitly define the type of `status` to prevent TypeScript
  // from widening the literal type to `string`, which caused type errors.
  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.id === updatedProduct.id) {
          const status: Product['status'] = updatedProduct.stock > 0 ? 'actif' : 'rupture';
          return {
            ...updatedProduct,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      storage.saveProducts(updatedProducts);
      return updatedProducts;
    });
  }, []);

  const deleteProduct = useCallback((productId: number) => {
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.filter(p => p.id !== productId);
      storage.saveProducts(updatedProducts);
      return updatedProducts;
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);
  
  const setLanguage = useCallback((newLanguage: Language) => {
    storage.setLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  const resetData = useCallback(() => {
    storage.resetData();
    setProducts([...MOCK_PRODUCTS]);
    storage.saveProducts([...MOCK_PRODUCTS]);
  }, []);


  return (
    <AppContext.Provider value={{ products, theme, language, addProduct, updateProduct, deleteProduct, setTheme, setLanguage, resetData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
