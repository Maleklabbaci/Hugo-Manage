import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Product, Theme, Language, ActivityLog, Sale, UserData } from '../types';
import { api } from '../services/api';
import { translations } from '../translations';
import { useAuth } from './AuthContext';

interface AppContextType {
  products: Product[];
  activityLog: ActivityLog[];
  sales: Sale[];
  theme: Theme;
  language: Language;
  t: (key: string, options?: { [key: string]: string | number }) => string;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'owner_id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  deleteMultipleProducts: (productIds: number[]) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<void>;
  addSale: (product: Product, quantity: number) => Promise<void>;
  cancelSale: (sale: Sale) => Promise<void>;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  resetData: () => Promise<void>;
  importData: (jsonData: string) => Promise<void>;
  exportData: () => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  
  const [theme, setThemeState] = useState<Theme>(api.getTheme());
  const [language, setLanguageState] = useState<Language>(api.getLanguage());

  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [initialProducts, initialSales, initialLogs] = await Promise.all([
        api.getProducts(),
        api.getSales(),
        api.getActivityLog(),
      ]);
      setProducts(initialProducts);
      setSales(initialSales);
      setActivityLog(initialLogs);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setProducts([]);
      setSales([]);
      setActivityLog([]);
    }
  }, [isAuthenticated, fetchAllData]);

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    let translation = translations[language]?.[key] || key;
    if (options) {
        Object.keys(options).forEach(optionKey => {
            translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
        });
    }
    return translation;
  }, [language]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    api.setTheme(theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  
  const logActivity = useCallback(async (logData: Omit<ActivityLog, 'id' | 'created_at' | 'owner_id' | 'timestamp'>) => {
    if (!currentUser) return;
    const newLog = {
      ...logData,
      timestamp: new Date().getTime(),
    };
    await api.addActivityLog(newLog);
    // Refresh log after adding
    setActivityLog(await api.getActivityLog());
  }, [currentUser]);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'owner_id'>) => {
    if (!currentUser) return;
    const newProductData = {
      ...productData,
      status: productData.stock > 0 ? 'actif' : 'rupture',
    };
    const newProduct = await api.addProduct(newProductData);
    await logActivity({
        action: 'created',
        product_id: newProduct.id,
        product_name: newProduct.name,
    });
    setProducts(await api.getProducts());
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (!currentUser) return;
    const originalProduct = products.find(p => p.id === updatedProduct.id);
    if (!originalProduct) return;
    
    const status = updatedProduct.stock > 0 ? 'actif' : 'rupture';
    const dataToUpdate = { ...updatedProduct, status };
    
    const changes: string[] = [];
    (Object.keys(dataToUpdate) as Array<keyof Product>).forEach(key => {
        if (key !== 'id' && key !== 'updated_at' && key !== 'status' && originalProduct[key] !== dataToUpdate[key]) {
             if(key === 'imageUrl') {
                  if((originalProduct.imageUrl || '') !== (dataToUpdate.imageUrl || '')) {
                       changes.push(t('history.log.image_updated'));
                  }
             } else {
                  changes.push(`${t('log.'+key) || key}: "${originalProduct[key]}" → "${dataToUpdate[key]}"`);
             }
        }
    });

    await api.updateProduct(updatedProduct.id, dataToUpdate);
    setProducts(await api.getProducts());

    if (changes.length > 0) {
        await logActivity({
            action: 'updated',
            product_id: updatedProduct.id,
            product_name: updatedProduct.name,
            details: changes.join('; '),
        });
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!currentUser) return;
    const productToDelete = products.find(p => p.id === productId);
    if (productToDelete) {
        await api.deleteProduct(productId);
        await logActivity({
          action: 'deleted',
          product_id: productToDelete.id,
          product_name: productToDelete.name,
        });
        setProducts(await api.getProducts());
    }
  };
  
  const deleteMultipleProducts = async (productIds: number[]) => {
    if (!currentUser) return;
    const productsToDelete = products.filter(p => productIds.includes(p.id));
    
    for (const product of productsToDelete) {
        await api.deleteProduct(product.id);
        await logActivity({
            action: 'deleted',
            product_id: product.id,
            product_name: product.name,
            details: t('history.log.bulk_delete'),
        });
    }
    setProducts(await api.getProducts());
  };

  const duplicateProduct = async (productId: number) => {
    if (!currentUser) return;
    const productToDuplicate = products.find(p => p.id === productId);
    if (!productToDuplicate) return;

    const { id, created_at, owner_id, ...rest } = productToDuplicate;
    const newProductData = {
        ...rest,
        name: `${productToDuplicate.name} (copie)`,
        stock: 0,
        status: 'rupture',
    };
    
    const newProduct = await api.addProduct(newProductData);
    await logActivity({
        action: 'created',
        product_id: newProduct.id,
        product_name: newProduct.name,
        details: t('history.log.duplicated', { productName: productToDuplicate.name }),
    });
    setProducts(await api.getProducts());
  };

  const addSale = async (productToSell: Product, quantity: number) => {
    if (!currentUser || productToSell.stock < quantity) return;

    const newSaleData = {
        product_id: productToSell.id,
        product_name: productToSell.name,
        quantity,
        sellPrice: productToSell.sellPrice,
        totalPrice: productToSell.sellPrice * quantity,
        totalMargin: (productToSell.sellPrice - productToSell.buyPrice) * quantity,
        timestamp: new Date().getTime(),
    };
    await api.addSale(newSaleData);

    const newStock = productToSell.stock - quantity;
    const status = newStock > 0 ? 'actif' : 'rupture';
    await api.updateProduct(productToSell.id, { ...productToSell, stock: newStock, status });

    await logActivity({
        action: 'sold',
        product_id: productToSell.id,
        product_name: productToSell.name,
        details: t('history.log.units_sold', { quantity }),
    });
    setProducts(await api.getProducts());
    setSales(await api.getSales());
  };

  const cancelSale = async (saleToCancel: Sale) => {
    if (!currentUser) return;
    
    const productToUpdate = products.find(p => p.id === saleToCancel.product_id);
    
    await api.deleteSale(saleToCancel.id);
    
    if (productToUpdate) {
        const newStock = productToUpdate.stock + saleToCancel.quantity;
        const status = newStock > 0 ? 'actif' : 'rupture';
        await api.updateProduct(productToUpdate.id, { ...productToUpdate, stock: newStock, status });
    }
    
    await logActivity({
        action: 'sale_cancelled',
        product_id: saleToCancel.product_id,
        product_name: saleToCancel.product_name,
        details: t('history.log.sale_cancelled', { quantity: saleToCancel.quantity }),
    });
    setProducts(await api.getProducts());
    setSales(await api.getSales());
  };

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);
  
  const setLanguage = useCallback((newLanguage: Language) => {
    api.setLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  const resetData = async () => {
    if (!currentUser) return;
    await api.resetData();
    await fetchAllData();
  };

  const exportData = async () => {
    if (!currentUser) return "";
    const data = await api.exportData();
    return data ? JSON.stringify(data, null, 2) : "";
  };

  const importData = async (jsonData: string): Promise<void> => {
    if (!currentUser) return Promise.reject('No user logged in');
    try {
        const data: UserData = JSON.parse(jsonData);
        if (Array.isArray(data.products) && Array.isArray(data.sales) && Array.isArray(data.activityLog)) {
            await api.importData(data);
            await fetchAllData();
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        throw error;
    }
  };

  return (
    <AppContext.Provider value={{ products, activityLog, sales, theme, language, t, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct, addSale, cancelSale, setTheme, setLanguage, resetData, exportData, importData }}>
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