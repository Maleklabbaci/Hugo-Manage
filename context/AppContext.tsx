import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { storage } from '../services/storage';
import { translations } from '../translations';
import { MOCK_PRODUCTS } from '../mock/products';

/*
-- =================================================================
-- SCRIPT SQL FINAL ET CORRIGÉ POUR SUPABASE
-- Exécutez ce code dans votre éditeur SQL Supabase pour configurer la base de données.
-- Il est recommandé de supprimer les anciennes tables avant d'exécuter ce script.
-- =================================================================

-- 1. Créer la table des produits
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier TEXT NOT NULL,
  buy_price REAL NOT NULL,
  sell_price REAL NOT NULL,
  stock INT NOT NULL,
  status TEXT NOT NULL, -- 'actif' or 'rupture'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url TEXT
);

-- 2. Créer la table des ventes
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  sell_price REAL NOT NULL,
  total_price REAL NOT NULL,
  total_margin REAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Créer la table du journal d'activité
CREATE TABLE activity_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT,
  product_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'sold', 'sale_cancelled'
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Activer la sécurité au niveau des lignes (Recommandé)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Créer des politiques d'accès (Exemple pour un accès public en lecture/écriture)
CREATE POLICY "Public access for all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for all" ON activity_log FOR ALL USING (true) WITH CHECK (true);

-- 6. Créer un trigger pour mettre à jour 'updated_at' automatiquement (BONNE PRATIQUE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
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
  addProduct: (product: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<Product | null>;
  deleteProduct: (productId: number) => Promise<void>;
  deleteMultipleProducts: (productIds: number[]) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const formatChanges = (oldData: Product, newData: Partial<Product>, t: AppContextType['t']): string => {
    const changes: string[] = [];
    (Object.keys(newData) as Array<keyof typeof newData>).forEach(key => {
        if (key in oldData && key !== 'updatedAt' && key !== 'createdAt' && key !== 'status' && key !== 'id' && oldData[key] !== newData[key]) {
            if(key === 'imageUrl' && newData[key]) {
                changes.push(t('history.log.image_updated'));
            } else if (key !== 'imageUrl') {
                changes.push(`${t(`log.${key}`)}: "${oldData[key]}" -> "${newData[key]}"`);
            }
        }
    });
    return changes.join(', ');
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [theme, setThemeState] = useState<Theme>(storage.getTheme());
  const [language, setLanguageState] = useState<Language>(storage.getLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [supabase, setSupabase] = useState<any | null>(null);

  useEffect(() => {
    const { supabaseUrl, supabaseAnonKey } = storage.getSupabaseCredentials();
    if (supabaseUrl && supabaseAnonKey) {
        setIsConfigured(true);
        // @ts-ignore
        setSupabase(window.supabase.createClient(supabaseUrl, supabaseAnonKey));
    } else {
        setIsConfigured(false);
        setProducts(MOCK_PRODUCTS);
        setIsLoading(false);
    }
  }, []);

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    let translation = translations[language][key] || key;
    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, String(v));
      });
    }
    return translation;
  }, [language]);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
        const [productsRes, salesRes, activityLogRes] = await Promise.all([
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('sales').select('*').order('timestamp', { ascending: false }),
            supabase.from('activity_log').select('*').order('timestamp', { ascending: false }),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (salesRes.error) throw salesRes.error;
        if (activityLogRes.error) throw activityLogRes.error;
        
        setProducts(productsRes.data.map((p: any): Product => ({
            id: p.id,
            name: p.name,
            category: p.category,
            supplier: p.supplier,
            buyPrice: p.buy_price,
            sellPrice: p.sell_price,
            stock: p.stock,
            status: p.status,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            imageUrl: p.image_url,
        })));
        setSales(salesRes.data.map((s: any): Sale => ({
            id: s.id,
            productId: s.product_id,
            productName: s.product_name,
            quantity: s.quantity,
            sellPrice: s.sell_price,
            totalPrice: s.total_price,
            totalMargin: s.total_margin,
            timestamp: s.timestamp,
        })));
        setActivityLog(activityLogRes.data.map((l: any): ActivityLog => ({
            id: l.id,
            productId: l.product_id,
            productName: l.product_name,
            action: l.action,
            details: l.details,
            timestamp: l.timestamp,
        })));
    } catch (error: any) {
        alert(`Error fetching data: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isConfigured && supabase) {
        fetchData();
    }
  }, [isConfigured, supabase, fetchData]);

  const addActivity = useCallback(async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    if (!supabase) return;
    await supabase.from('activity_log').insert([{ product_id: log.productId, product_name: log.productName, action: log.action, details: log.details }]);
  }, [supabase]);

  const addProduct = useCallback(async (payload: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('products').insert([{
            name: payload.name,
            category: payload.category,
            supplier: payload.supplier,
            buy_price: payload.buyPrice,
            sell_price: payload.sellPrice,
            stock: payload.stock,
            status: payload.stock > 0 ? 'actif' : 'rupture',
            image_url: payload.imageUrl,
        }]).select();
        
        if (error) throw error;
        
        const newProduct = data[0];
        await addActivity({ productId: newProduct.id, productName: newProduct.name, action: 'created' });
        await fetchData();
        return { 
            id: newProduct.id,
            name: newProduct.name,
            category: newProduct.category,
            supplier: newProduct.supplier,
            buyPrice: newProduct.buy_price,
            sellPrice: newProduct.sell_price,
            stock: newProduct.stock,
            status: newProduct.status,
            createdAt: newProduct.created_at,
            updatedAt: newProduct.updated_at,
            imageUrl: newProduct.image_url,
         };
    } catch (error: any) {
        alert(t('product_form.error_add', { error: error.message }));
        return null;
    }
  }, [supabase, addActivity, fetchData, t]);

  const updateProduct = useCallback(async (product: Product): Promise<Product | null> => {
    if (!supabase) return null;
    const originalProduct = products.find(p => p.id === product.id);
    if (!originalProduct) return null;

    try {
        const details = formatChanges(originalProduct, product, t);
        const { data, error } = await supabase.from('products').update({
            name: product.name,
            category: product.category,
            supplier: product.supplier,
            buy_price: product.buyPrice,
            sell_price: product.sellPrice,
            stock: product.stock,
            status: product.stock > 0 ? 'actif' : 'rupture',
            image_url: product.imageUrl,
        }).eq('id', product.id).select();

        if (error) throw error;
        if (details) await addActivity({ productId: product.id, productName: product.name, action: 'updated', details });
        
        await fetchData();
        const updatedProduct = data[0];
        return { 
            id: updatedProduct.id,
            name: updatedProduct.name,
            category: updatedProduct.category,
            supplier: updatedProduct.supplier,
            buyPrice: updatedProduct.buy_price,
            sellPrice: updatedProduct.sell_price,
            stock: updatedProduct.stock,
            status: updatedProduct.status,
            createdAt: updatedProduct.created_at,
            updatedAt: updatedProduct.updated_at,
            imageUrl: updatedProduct.image_url,
         };
    } catch (error: any) {
        alert(t('product_form.error_update', { error: error.message }));
        return null;
    }
  }, [supabase, products, addActivity, fetchData, t]);

  const deleteProduct = useCallback(async (productId: number) => {
    if (!supabase) return;
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;
    
    await addActivity({ productId, productName: productToDelete.name, action: 'deleted' });
    await supabase.from('products').delete().eq('id', productId);
    await fetchData();
  }, [supabase, products, addActivity, fetchData]);
  
  const deleteMultipleProducts = useCallback(async (productIds: number[]) => {
    if (!supabase) return;
    for (const id of productIds) {
        const product = products.find(p => p.id === id);
        if (product) await addActivity({ productId: id, productName: product.name, action: 'deleted', details: t('history.log.bulk_delete')});
    }
    await supabase.from('products').delete().in('id', productIds);
    await fetchData();
  }, [supabase, products, addActivity, fetchData, t]);
  
  const duplicateProduct = useCallback(async (productId: number) => {
      const productToDuplicate = products.find(p => p.id === productId);
      if (!productToDuplicate) return;
      
      const { id, status, createdAt, updatedAt, ...newProductData } = productToDuplicate;
      newProductData.name = `${newProductData.name} (copie)`;
      
      const newProduct = await addProduct(newProductData);
      if (newProduct) {
          await addActivity({ productId: newProduct.id, productName: newProduct.name, action: 'created', details: t('history.log.duplicated', { productName: productToDuplicate.name})});
      }
  }, [products, addProduct, addActivity, t]);

  const addSale = useCallback(async (productId: number, quantity: number) => {
    if (!supabase) return;
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return;

    const newStock = product.stock - quantity;
    const saleData = {
        product_id: productId,
        product_name: product.name,
        quantity,
        sell_price: product.sellPrice,
        total_price: product.sellPrice * quantity,
        total_margin: (product.sellPrice - product.buyPrice) * quantity,
    };
    
    await supabase.from('sales').insert([saleData]);
    await supabase.from('products').update({ stock: newStock, status: newStock > 0 ? 'actif' : 'rupture' }).eq('id', productId);
    await addActivity({ productId, productName: product.name, action: 'sold', details: t('history.log.units_sold', {quantity}) });
    await fetchData();
  }, [supabase, products, addActivity, fetchData, t]);
  
  const cancelSale = useCallback(async (saleId: number) => {
    if (!supabase) return;
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const product = products.find(p => p.id === sale.productId);
    if (product) {
        const newStock = product.stock + sale.quantity;
        await supabase.from('products').update({ stock: newStock, status: 'actif' }).eq('id', product.id);
    }
    
    await supabase.from('sales').delete().eq('id', saleId);
    await addActivity({ productId: sale.productId, productName: sale.productName, action: 'sale_cancelled', details: t('history.log.sale_cancelled', {quantity: sale.quantity}) });
    await fetchData();
  }, [supabase, sales, products, addActivity, fetchData, t]);
  
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storage.setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
      setLanguageState(newLanguage);
      storage.setLanguage(newLanguage);
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
  }, []);
  
  useEffect(() => {
      setLanguage(language);
      setTheme(theme);
  }, [language, theme, setLanguage, setTheme]);

  return (
    <AppContext.Provider value={{
      products, activityLog, sales, theme, language, isLoading, isConfigured, t,
      addProduct, updateProduct, deleteProduct, deleteMultipleProducts, duplicateProduct,
      addSale, cancelSale, setTheme, setLanguage
    }}>
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