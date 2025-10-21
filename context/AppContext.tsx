import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { storage } from '../services/storage';
import { MOCK_PRODUCTS } from '../mock/products';


interface AppContextType {
  products: Product[];
  activityLog: ActivityLog[];
  sales: Sale[];
  theme: Theme;
  language: Language;
  addProduct: (product: Omit<Product, 'id' | 'status' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  deleteMultipleProducts: (productIds: number[]) => void;
  duplicateProduct: (productId: number) => void;
  addSale: (productId: number, quantity: number) => void;
  deleteSale: (saleId: number) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const keyToFrench: Record<string, string> = {
    name: "Nom",
    category: "Catégorie",
    supplier: "Fournisseur",
    buyPrice: "Prix d'achat",
    sellPrice: "Prix de vente",
    stock: "Stock",
    imageUrl: "Image",
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(storage.loadProducts());
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(storage.loadActivityLog());
  const [sales, setSales] = useState<Sale[]>(storage.loadSales());
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
  
  const logActivity = useCallback((logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    setActivityLog(prevLog => {
      const newLog: ActivityLog = {
        ...logData,
        id: prevLog.length > 0 ? Math.max(...prevLog.map(l => l.id)) + 1 : 1,
        timestamp: new Date().toISOString(),
      };
      const updatedLog = [newLog, ...prevLog];
      storage.saveActivityLog(updatedLog);
      return updatedLog;
    });
  }, []);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'status' | 'updatedAt'>) => {
    let newProduct: Product | null = null;
    setProducts(prevProducts => {
      newProduct = {
        ...productData,
        id: prevProducts.length > 0 ? Math.max(...prevProducts.map(p => p.id)) + 1 : 1,
        status: productData.stock > 0 ? 'actif' : 'rupture',
        updatedAt: new Date().toISOString(),
      };
      const updatedProducts = [...prevProducts, newProduct];
      storage.saveProducts(updatedProducts);
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
  }, [logActivity]);

  const updateProduct = useCallback((updatedProduct: Product) => {
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
                       changes.push(`l'image a été modifiée`);
                     }
                } else {
                     changes.push(`${keyToFrench[key] || key}: "${originalProduct[key]}" → "${updatedProduct[key]}"`);
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
      
      storage.saveProducts(updatedProducts);
      return updatedProducts;
    });
  }, [logActivity]);

  const deleteProduct = useCallback((productId: number) => {
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
      storage.saveProducts(updatedProducts);
      return updatedProducts;
    });
  }, [logActivity]);
  
  const deleteMultipleProducts = useCallback((productIds: number[]) => {
    setProducts(prevProducts => {
        const productsToDelete = prevProducts.filter(p => productIds.includes(p.id));
        
        productsToDelete.forEach(product => {
            logActivity({
                action: 'deleted',
                productId: product.id,
                productName: product.name,
                details: 'Supprimé via action groupée',
            });
        });

        const updatedProducts = prevProducts.filter(p => !productIds.includes(p.id));
        storage.saveProducts(updatedProducts);
        return updatedProducts;
    });
  }, [logActivity]);

  const duplicateProduct = useCallback((productId: number) => {
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
      storage.saveProducts(updatedProducts);
      return updatedProducts;
    });

    setTimeout(() => {
        if (newProduct) {
             logActivity({
                action: 'created',
                productId: newProduct.id,
                productName: newProduct.name,
                details: `Dupliqué depuis "${productToDuplicate.name}"`,
            });
        }
    }, 0);
  }, [products, logActivity]);

  const addSale = useCallback((productId: number, quantity: number) => {
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
        storage.saveSales(updatedSales);
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
        storage.saveProducts(updatedProducts);
        return updatedProducts;
    });

    logActivity({
        action: 'sold',
        productId: productToSell.id,
        productName: productToSell.name,
        details: `${quantity} unité(s) vendue(s)`,
    });
  }, [products, sales, logActivity]);

  const deleteSale = useCallback((saleId: number) => {
    let saleToDelete: Sale | undefined;

    setSales(prevSales => {
        saleToDelete = prevSales.find(s => s.id === saleId);
        if (!saleToDelete) return prevSales;
        
        const updatedSales = prevSales.filter(s => s.id !== saleId);
        storage.saveSales(updatedSales);
        return updatedSales;
    });

    if (!saleToDelete) {
        console.error("Vente non trouvée");
        return;
    }
    
    const saleInfo = saleToDelete;

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
        storage.saveProducts(updatedProducts);
        return updatedProducts;
    });
    
    setTimeout(() => {
        logActivity({
            action: 'sale_cancelled',
            productId: saleInfo.productId,
            productName: saleInfo.productName,
            details: `Vente de ${saleInfo.quantity} unité(s) annulée.`,
        });
    }, 0);

  }, [logActivity]);


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
    setActivityLog([]);
    setSales([]);
    storage.saveProducts([...MOCK_PRODUCTS]);
  }, []);


  return (
    <AppContext.Provider value={{ products, activityLog, sales, theme, language, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct, addSale, deleteSale, setTheme, setLanguage, resetData }}>
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