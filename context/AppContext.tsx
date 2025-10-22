
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { storage } from '../services/storage';
import { translations } from '../translations';
import { useAuth } from './AuthContext';

interface AppContextType {
  products: Product[];
  activityLog: ActivityLog[];
  sales: Sale[];
  theme: Theme;
  language: Language;
  t: (key: string, options?: { [key: string]: string | number }) => string;
  addProduct: (product: Omit<Product, 'id' | 'status' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  deleteMultipleProducts: (productIds: number[]) => void;
  duplicateProduct: (productId: number) => void;
  addSale: (productId: number, quantity: number) => void;
  cancelSale: (saleId: number) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  resetData: () => void;
  importData: (jsonData: string) => Promise<void>;
  exportData: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  
  const [theme, setThemeState] = useState<Theme>(storage.getTheme());
  const [language, setLanguageState] = useState<Language>(storage.getLanguage());

  // Load user data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setProducts(storage.loadProducts(currentUser));
      setActivityLog(storage.loadActivityLog(currentUser));
      setSales(storage.loadSales(currentUser));
    } else {
      // Clear data on logout
      setProducts([]);
      setActivityLog([]);
      setSales([]);
    }
  }, [isAuthenticated, currentUser]);

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
    storage.setTheme(theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  
  const logActivity = useCallback((logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    if (!currentUser) return;
    setActivityLog(prevLog => {
      const newLog: ActivityLog = {
        ...logData,
        id: prevLog.length > 0 ? Math.max(...prevLog.map(l => l.id)) + 1 : 1,
        timestamp: new Date().toISOString(),
      };
      const updatedLog = [newLog, ...prevLog];
      storage.saveActivityLog(currentUser, updatedLog);
      return updatedLog;
    });
  }, [currentUser]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'status' | 'updatedAt'>) => {
    if (!currentUser) return;
    let newProduct: Product | null = null;
    setProducts(prevProducts => {
      newProduct = {
        ...productData,
        id: prevProducts.length > 0 ? Math.max(...prevProducts.map(p => p.id)) + 1 : 1,
        status: productData.stock > 0 ? 'actif' : 'rupture',
        updatedAt: new Date().toISOString(),
      };
      const updatedProducts = [...prevProducts, newProduct];
      storage.saveProducts(currentUser, updatedProducts);
      return updatedProducts;
    });

    setTimeout(() => {
        if (newProduct) {
             logActivity({
                action: 'created',
                productId: newProduct.id,
                productName: newProduct.name,
            });
        }
    }, 0);
  }, [logActivity, currentUser]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    if (!currentUser) return;
    setProducts(prevProducts => {
      const originalProduct = prevProducts.find(p => p.id === updatedProduct.id);
      
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

      if (originalProduct) {
        const changes: string[] = [];
        (Object.keys(updatedProduct) as Array<keyof Product>).forEach(key => {
            if (key !== 'id' && key !== 'updatedAt' && key !== 'status' && originalProduct[key] !== updatedProduct[key]) {
                if(key === 'imageUrl') {
                     if((originalProduct.imageUrl || '') !== (updatedProduct.imageUrl || '')) {
                       changes.push(t('history.log.image_updated'));
                     }
                } else {
                     changes.push(`${t('log.'+key) || key}: "${originalProduct[key]}" → "${updatedProduct[key]}"`);
                }
            }
        });
        if (changes.length > 0) {
            logActivity({
                action: 'updated',
                productId: updatedProduct.id,
                productName: updatedProduct.name,
                details: changes.join('; '),
            });
        }
      }
      
      storage.saveProducts(currentUser, updatedProducts);
      return updatedProducts;
    });
  }, [logActivity, t, currentUser]);

  const deleteProduct = useCallback((productId: number) => {
    if (!currentUser) return;
    setProducts(prevProducts => {
      const productToDelete = prevProducts.find(p => p.id === productId);
      if (productToDelete) {
        logActivity({
          action: 'deleted',
          productId: productToDelete.id,
          productName: productToDelete.name,
        });
      }
      const updatedProducts = prevProducts.filter(p => p.id !== productId);
      storage.saveProducts(currentUser, updatedProducts);
      return updatedProducts;
    });
  }, [logActivity, currentUser]);
  
  const deleteMultipleProducts = useCallback((productIds: number[]) => {
    if (!currentUser) return;
    setProducts(prevProducts => {
        const productsToDelete = prevProducts.filter(p => productIds.includes(p.id));
        
        productsToDelete.forEach(product => {
            logActivity({
                action: 'deleted',
                productId: product.id,
                productName: product.name,
                details: t('history.log.bulk_delete'),
            });
        });

        const updatedProducts = prevProducts.filter(p => !productIds.includes(p.id));
        storage.saveProducts(currentUser, updatedProducts);
        return updatedProducts;
    });
  }, [logActivity, t, currentUser]);

  const duplicateProduct = useCallback((productId: number) => {
    if (!currentUser) return;
    const productToDuplicate = products.find(p => p.id === productId);
    if (!productToDuplicate) {
        console.error("Produit à dupliquer non trouvé");
        return;
    }

    let newProduct: Product | null = null;
    setProducts(prevProducts => {
      newProduct = {
        ...productToDuplicate,
        id: prevProducts.length > 0 ? Math.max(...prevProducts.map(p => p.id)) + 1 : 1,
        name: `${productToDuplicate.name} (copie)`,
        stock: 0,
        status: 'rupture',
        updatedAt: new Date().toISOString(),
      };
      const updatedProducts = [...prevProducts, newProduct];
      storage.saveProducts(currentUser, updatedProducts);
      return updatedProducts;
    });

    setTimeout(() => {
        if (newProduct) {
             logActivity({
                action: 'created',
                productId: newProduct.id,
                productName: newProduct.name,
                details: t('history.log.duplicated', {productName: productToDuplicate.name}),
            });
        }
    }, 0);
  }, [products, logActivity, t, currentUser]);

  const addSale = useCallback((productId: number, quantity: number) => {
    if (!currentUser) return;
    const productToSell = products.find(p => p.id === productId);
    if (!productToSell || productToSell.stock < quantity) {
        console.error("Stock insuffisant ou produit non trouvé");
        return;
    }

    const newSale: Sale = {
        id: sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1,
        productId: productToSell.id,
        productName: productToSell.name,
        quantity,
        sellPrice: productToSell.sellPrice,
        totalPrice: productToSell.sellPrice * quantity,
        totalMargin: (productToSell.sellPrice - productToSell.buyPrice) * quantity,
        timestamp: new Date().toISOString(),
    };

    setSales(prevSales => {
        const updatedSales = [newSale, ...prevSales];
        storage.saveSales(currentUser, updatedSales);
        return updatedSales;
    });

    setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(p => {
            if (p.id === productId) {
                const newStock = p.stock - quantity;
                const status: Product['status'] = newStock > 0 ? 'actif' : 'rupture';
                return {
                    ...p,
                    stock: newStock,
                    status,
                    updatedAt: new Date().toISOString(),
                };
            }
            return p;
        });
        storage.saveProducts(currentUser, updatedProducts);
        return updatedProducts;
    });

    logActivity({
        action: 'sold',
        productId: productToSell.id,
        productName: productToSell.name,
        details: t('history.log.units_sold', { quantity }),
    });
  }, [products, sales, logActivity, t, currentUser]);

  const cancelSale = useCallback((saleId: number) => {
    if (!currentUser) return;
    let saleToCancel: Sale | undefined;

    setSales(prevSales => {
        saleToCancel = prevSales.find(s => s.id === saleId);
        if (!saleToCancel) return prevSales;
        
        const updatedSales = prevSales.filter(s => s.id !== saleId);
        storage.saveSales(currentUser, updatedSales);
        return updatedSales;
    });

    if (!saleToCancel) {
        console.error("Vente non trouvée");
        return;
    }
    
    const saleInfo = saleToCancel;

    setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(p => {
            if (p.id === saleInfo.productId) {
                const newStock = p.stock + saleInfo.quantity;
                const status: Product['status'] = newStock > 0 ? 'actif' : 'rupture';
                return {
                    ...p,
                    stock: newStock,
                    status,
                    updatedAt: new Date().toISOString(),
                };
            }
            return p;
        });
        storage.saveProducts(currentUser, updatedProducts);
        return updatedProducts;
    });
    
    setTimeout(() => {
        logActivity({
            action: 'sale_cancelled',
            productId: saleInfo.productId,
            productName: saleInfo.productName,
            details: t('history.log.sale_cancelled', { quantity: saleInfo.quantity }),
        });
    }, 0);

  }, [logActivity, t, currentUser]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);
  
  const setLanguage = useCallback((newLanguage: Language) => {
    storage.setLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  const resetData = useCallback(() => {
    if (!currentUser) return;
    storage.resetData(currentUser);
    // Reload data into state after reset
    setProducts(storage.loadProducts(currentUser));
    setActivityLog(storage.loadActivityLog(currentUser));
    setSales(storage.loadSales(currentUser));
  }, [currentUser]);

  const exportData = useCallback(() => {
    if (!currentUser) return "";
    const data = storage.exportUserData(currentUser);
    return data ? JSON.stringify(data, null, 2) : "";
  }, [currentUser]);

  const importData = useCallback(async (jsonData: string): Promise<void> => {
    if (!currentUser) return Promise.reject('No user logged in');
    return new Promise((resolve, reject) => {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data.products) && Array.isArray(data.sales) && Array.isArray(data.activityLog)) {
                storage.importUserData(currentUser, data);
                setProducts(data.products);
                setSales(data.sales);
                setActivityLog(data.activityLog);
                resolve();
            } else {
                reject(new Error('Invalid data format'));
            }
        } catch (error) {
            reject(error);
        }
    });
  }, [currentUser]);

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
