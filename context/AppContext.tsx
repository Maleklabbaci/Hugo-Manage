import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { storage } from '../services/storage';
import { translations } from '../translations';

/*
-- =================================================================
-- SUPABASE SCHEMA SETUP
-- Run this SQL in your Supabase SQL Editor to set up the database.
-- =================================================================

-- 1. Create Products Table
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier TEXT NOT NULL,
  "buyPrice" REAL NOT NULL,
  "sellPrice" REAL NOT NULL,
  stock INT NOT NULL,
  status TEXT NOT NULL, -- 'actif' or 'rupture'
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "imageUrl" TEXT
);

-- 2. Create Sales Table
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "productId" BIGINT REFERENCES products(id) ON DELETE SET NULL,
  "productName" TEXT NOT NULL,
  quantity INT NOT NULL,
  "sellPrice" REAL NOT NULL,
  "totalPrice" REAL NOT NULL,
  "totalMargin" REAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Activity Log Table
CREATE TABLE activity_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "productId" BIGINT,
  "productName" TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'sold', 'sale_cancelled'
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable Row Level Security (Recommended)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Example for public read/write access, adjust as needed)
CREATE POLICY "Public access for all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
*/


interface AppContextType {
  products: Product[];
  activityLog: ActivityLog[];
  sales: Sale[];
  theme: Theme;
  language: Language;
  isLoading: boolean;
  isConfigured: boolean;
  t: (key: string, options?: { [key: string]: string | number }) => string;
  addProduct: (product: Omit<Product, 'id' | 'status' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  deleteMultipleProducts: (productIds: number[]) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [theme, setThemeState] = useState<Theme>(storage.getTheme());
  const [language, setLanguageState] = useState<Language>(storage.getLanguage());

  const [supabase, setSupabase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const { supabaseUrl, supabaseAnonKey } = storage.getSupabaseCredentials();
    if (supabaseUrl && supabaseAnonKey && (window as any).supabase) {
        const client = (window as any).supabase.createClient(supabaseUrl, supabaseAnonKey);
        setSupabase(client);
        setIsConfigured(true);
    } else {
        setIsLoading(false);
        setIsConfigured(false);
    }
  }, []);
  
  const fetchData = useCallback(async (client: any) => {
    try {
        setIsLoading(true);
        const [productsRes, salesRes, activityLogRes] = await Promise.all([
            client.from('products').select('*').order('id', { ascending: false }),
            client.from('sales').select('*').order('id', { ascending: false }),
            client.from('activity_log').select('*').order('id', { ascending: false }),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (salesRes.error) throw salesRes.error;
        if (activityLogRes.error) throw activityLogRes.error;

        setProducts(productsRes.data);
        setSales(salesRes.data);
        setActivityLog(activityLogRes.data);

    } catch (error) {
        console.error("Error fetching data from Supabase:", error);
        alert("Failed to fetch data. Check your Supabase configuration and network connection.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supabase) {
        fetchData(supabase);
    }
  }, [supabase, fetchData]);

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
  
  const logActivity = useCallback(async (logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    if (!supabase) return;
    const newLog: Omit<ActivityLog, 'id'> = {
        ...logData,
        timestamp: new Date().toISOString(),
    };
    
    const { data, error } = await supabase.from('activity_log').insert(newLog).select();
    if (error) {
        console.error("Failed to log activity:", error);
    } else {
        setActivityLog(prev => [data[0], ...prev]);
    }
  }, [supabase]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'status' | 'updatedAt'>) => {
    if (!supabase) return;
    const newProductData = {
        ...productData,
        status: productData.stock > 0 ? 'actif' : 'rupture',
        updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('products').insert(newProductData).select();
    
    if (error) {
        console.error("Failed to add product:", error);
    } else {
        const newProduct = data[0];
        setProducts(prev => [newProduct, ...prev]);
        logActivity({
            action: 'created',
            productId: newProduct.id,
            productName: newProduct.name,
        });
    }
  }, [supabase, logActivity]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    if (!supabase) return;
    const originalProduct = products.find(p => p.id === updatedProduct.id);
    
    const payload = {
      ...updatedProduct,
      status: updatedProduct.stock > 0 ? 'actif' : 'rupture',
      updatedAt: new Date().toISOString(),
    };

    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? payload : p));
    
    const { error } = await supabase.from('products').update(payload).match({ id: updatedProduct.id });

    if (error) {
        console.error("Failed to update product:", error);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? originalProduct || p : p)); // Revert
    } else {
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
    }
  }, [supabase, products, logActivity, t]);

  const deleteProduct = useCallback(async (productId: number) => {
    if (!supabase) return;
    const productToDelete = products.find(p => p.id === productId);

    setProducts(prev => prev.filter(p => p.id !== productId));
    
    const { error } = await supabase.from('products').delete().match({ id: productId });
    
    if (error) {
        console.error("Failed to delete product:", error);
        if (productToDelete) setProducts(prev => [...prev, productToDelete].sort((a,b)=>b.id-a.id)); // Revert
    } else {
        if (productToDelete) {
            logActivity({
              action: 'deleted',
              productId: productToDelete.id,
              productName: productToDelete.name,
            });
        }
    }
  }, [supabase, products, logActivity]);
  
  const deleteMultipleProducts = useCallback(async (productIds: number[]) => {
    if (!supabase) return;
    const productsToDelete = products.filter(p => productIds.includes(p.id));

    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));

    const { error } = await supabase.from('products').delete().in('id', productIds);

    if (error) {
        console.error("Failed to bulk delete products:", error);
        setProducts(prev => [...prev, ...productsToDelete].sort((a,b)=>b.id-a.id)); // Revert
    } else {
        productsToDelete.forEach(product => {
            logActivity({
                action: 'deleted',
                productId: product.id,
                productName: product.name,
                details: t('history.log.bulk_delete'),
            });
        });
    }
  }, [supabase, products, logActivity, t]);

  const duplicateProduct = useCallback(async (productId: number) => {
    if (!supabase) return;
    const productToDuplicate = products.find(p => p.id === productId);
    if (!productToDuplicate) return;

    const { id, ...newProductData } = productToDuplicate;
    const duplicatedProductPayload = {
        ...newProductData,
        name: `${productToDuplicate.name} (copie)`,
        stock: 0,
        status: 'rupture',
        updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('products').insert(duplicatedProductPayload).select();

    if (error) {
        console.error("Failed to duplicate product:", error);
    } else {
        const newProduct = data[0];
        setProducts(prev => [newProduct, ...prev]);
        logActivity({
            action: 'created',
            productId: newProduct.id,
            productName: newProduct.name,
            details: t('history.log.duplicated', {productName: productToDuplicate.name}),
        });
    }
  }, [supabase, products, logActivity, t]);

  const addSale = useCallback(async (productId: number, quantity: number) => {
    if (!supabase) return;
    const productToSell = products.find(p => p.id === productId);
    if (!productToSell || productToSell.stock < quantity) return;

    const newSaleData = {
        productId: productToSell.id,
        productName: productToSell.name,
        quantity,
        sellPrice: productToSell.sellPrice,
        totalPrice: productToSell.sellPrice * quantity,
        totalMargin: (productToSell.sellPrice - productToSell.buyPrice) * quantity,
        timestamp: new Date().toISOString(),
    };

    const { data: saleData, error: saleError } = await supabase.from('sales').insert(newSaleData).select();

    if (saleError) {
        console.error("Failed to add sale:", saleError);
        return;
    }

    const newStock = productToSell.stock - quantity;
    const updatedProductData = {
        stock: newStock,
        status: newStock > 0 ? 'actif' : 'rupture',
        updatedAt: new Date().toISOString(),
    };
    
    const { error: productError } = await supabase.from('products').update(updatedProductData).match({ id: productId });
    
    if (productError) {
        console.error("Failed to update product stock after sale:", productError);
        // Rollback sale
        await supabase.from('sales').delete().match({ id: saleData[0].id });
    } else {
        setSales(prev => [saleData[0], ...prev]);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedProductData } : p));
        logActivity({
            action: 'sold',
            productId: productToSell.id,
            productName: productToSell.name,
            details: t('history.log.units_sold', { quantity }),
        });
    }
  }, [supabase, products, logActivity, t]);

  const cancelSale = useCallback(async (saleId: number) => {
    if (!supabase) return;
    const saleToCancel = sales.find(s => s.id === saleId);
    if (!saleToCancel) return;

    const { error: deleteError } = await supabase.from('sales').delete().match({ id: saleId });
    if (deleteError) {
        console.error("Failed to cancel sale:", deleteError);
        return;
    }

    const product = products.find(p => p.id === saleToCancel.productId);
    if (product) {
        const newStock = product.stock + saleToCancel.quantity;
        const updatedProductData = {
            stock: newStock,
            status: newStock > 0 ? 'actif' : 'rupture',
            updatedAt: new Date().toISOString(),
        };

        const { error: updateError } = await supabase.from('products').update(updatedProductData).match({ id: product.id });
        if (updateError) {
            console.error("Failed to restore stock:", updateError);
            // Rollback cancel sale...
            await supabase.from('sales').insert(saleToCancel);
        } else {
            setSales(prev => prev.filter(s => s.id !== saleId));
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updatedProductData } : p));
            logActivity({
                action: 'sale_cancelled',
                productId: saleToCancel.productId,
                productName: saleToCancel.productName,
                details: t('history.log.sale_cancelled', { quantity: saleToCancel.quantity }),
            });
        }
    }
  }, [supabase, products, sales, logActivity, t]);

  const setTheme = useCallback((newTheme: Theme) => setThemeState(newTheme), []);
  const setLanguage = useCallback((newLanguage: Language) => {
    storage.setLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  return (
    <AppContext.Provider value={{ products, activityLog, sales, theme, language, isLoading, isConfigured, t, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct, addSale, cancelSale, setTheme, setLanguage }}>
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