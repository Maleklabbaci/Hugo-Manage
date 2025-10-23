import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Product, Theme, Language, ActivityLog, Sale } from '../types';
import { storage } from '../services/storage';
import { translations } from '../translations';
import { MOCK_PRODUCTS } from '../mock/products';

/*
-- =================================================================
-- SCRIPT SQL DÉFINITIF - À EXÉCUTER DANS SUPABASE
-- =================================================================
--
-- !! ATTENTION !!
-- POUR QUE L'APPLICATION FONCTIONNE, VOUS DEVEZ IMPÉRATIVEMENT
-- EXÉCUTER CE SCRIPT SQL DANS VOTRE ÉDITEUR SQL SUPABASE.
--
-- ÉTAPES :
-- 1. (RECOMMANDÉ) Supprimez vos anciennes tables : products, sales, activity_log.
-- 2. Copiez et collez L'INTÉGRALITÉ de ce script ci-dessous.
-- 3. Exécutez-le.
--
-- CE SCRIPT CORRIGE LES ERREURS "column not found" CAR IL UTILISE
-- LES BONS NOMS DE COLONNES (ex: `buy_price`, `created_at`).
--
-- =================================================================

-- 1. Créer une fonction pour mettre à jour automatiquement la colonne 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Créer la table des produits (`products`)
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier TEXT NOT NULL,
  buy_price REAL NOT NULL,
  sell_price REAL NOT NULL,
  stock INT NOT NULL,
  status TEXT NOT NULL, -- Doit être 'actif' ou 'rupture'
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Créer la table des ventes (`sales`)
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  sell_price REAL NOT NULL,
  total_price REAL NOT NULL,
  total_margin REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Créer la table du journal d'activité (`activity_log`)
CREATE TABLE activity_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT,
  product_name TEXT NOT NULL,
  action TEXT NOT NULL, -- ex: 'created', 'updated', 'sold'
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Attacher le trigger à la table 'products' pour automatiser 'updated_at'
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Activer la Sécurité au Niveau des Lignes (Row Level Security - RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 7. Créer des politiques d'accès pour autoriser les opérations
CREATE POLICY "Public access for all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
*/


interface AppContextType {
  products: Product[];
  sales: Sale[];
  activityLog: ActivityLog[];
  theme: Theme;
  language: Language;
  isLoading: boolean;
  isConfigured: boolean;
  supabase: SupabaseClient | null;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  addProduct: (productData: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<Product | null>;
  deleteProduct: (productId: number) => Promise<void>;
  deleteMultipleProducts: (productIds: number[]) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert snake_case to camelCase
const snakeToCamel = (str: string) => str.replace(/_([a-z])/g, g => g[1].toUpperCase());

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [theme, rawSetTheme] = useState<Theme>(storage.getTheme());
  const [language, rawSetLanguage] = useState<Language>(storage.getLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const { supabaseUrl, supabaseAnonKey } = storage.getSupabaseCredentials();
    if (supabaseUrl && supabaseAnonKey) {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      setSupabase(client);
      setIsConfigured(true);
    } else {
      setProducts(MOCK_PRODUCTS);
      setIsLoading(false);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    storage.setTheme(newTheme);
    rawSetTheme(newTheme);
  };

  const setLanguage = (newLanguage: Language) => {
    storage.setLanguage(newLanguage);
    rawSetLanguage(newLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, language]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let translation = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    return translation;
  }, [language]);
    
  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productsError) throw productsError;

      const { data: salesData, error: salesError } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (salesError) throw salesError;

      const { data: logData, error: logError } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false });
      if (logError) throw logError;

      setProducts(productsData.map((p: any) => ({
        id: p.id, name: p.name, category: p.category, supplier: p.supplier,
        buyPrice: p.buy_price, sellPrice: p.sell_price, stock: p.stock,
        status: p.status, createdAt: p.created_at, updatedAt: p.updated_at,
        imageUrl: p.image_url,
      })));
      setSales(salesData.map((s: any) => ({
        id: s.id, productId: s.product_id, productName: s.product_name,
        quantity: s.quantity, sellPrice: s.sell_price, totalPrice: s.total_price,
        totalMargin: s.total_margin, createdAt: s.created_at,
      })));
      setActivityLog(logData.map((l: any) => ({
        id: l.id, productId: l.product_id, productName: l.product_name,
        action: l.action, details: l.details, createdAt: l.created_at,
      })));

    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Error fetching data: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isConfigured) {
      fetchData();
    }
  }, [isConfigured, fetchData]);

  const logActivity = async (action: ActivityLog['action'], product: { id: number; name: string; }, details?: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('activity_log').insert({
      product_id: product.id,
      product_name: product.name,
      action: action,
      details: details || null,
    });
    if (error) console.error("Error logging activity:", error);
  };
  
  const addProduct = async (productData: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    if (!supabase) return null;
    try {
      const newProductPayload = {
        name: productData.name, category: productData.category, supplier: productData.supplier,
        buy_price: productData.buyPrice, sell_price: productData.sellPrice, stock: productData.stock,
        image_url: productData.imageUrl, status: productData.stock > 0 ? 'actif' : 'rupture',
      };
      const { data, error } = await supabase.from('products').insert(newProductPayload).select().single();
      if (error) throw error;
      
      const createdProduct = { ...productData, id: data.id, status: newProductPayload.status as ('actif' | 'rupture'), createdAt: data.created_at, updatedAt: data.updated_at };
      await logActivity('created', createdProduct);
      await fetchData();
      return createdProduct;
    } catch (error) {
      alert(t('product_form.error_add', { error: (error as Error).message }));
      return null;
    }
  };

  const updateProduct = async (product: Product): Promise<Product | null> => {
    if (!supabase) return null;
    const oldProduct = products.find(p => p.id === product.id);
    if (!oldProduct) return null;

    try {
      const updatedProductPayload = {
        name: product.name, category: product.category, supplier: product.supplier,
        buy_price: product.buyPrice, sell_price: product.sellPrice, stock: product.stock,
        image_url: product.imageUrl, status: product.stock > 0 ? 'actif' : 'rupture',
      };
      const { data, error } = await supabase.from('products').update(updatedProductPayload).eq('id', product.id).select().single();
      if (error) throw error;
      
      const changes: string[] = [];
      for (const key of Object.keys(updatedProductPayload) as Array<keyof typeof updatedProductPayload>) {
          if (key === 'status' || key === 'image_url') continue;

          const camelCaseKey = snakeToCamel(key) as keyof Product;
          const oldValue = oldProduct[camelCaseKey];
          const newValue = product[camelCaseKey];

          if (String(oldValue) !== String(newValue)) {
              changes.push(`${t('log.' + camelCaseKey)}: "${oldValue}" -> "${newValue}"`);
          }
      }

      if (updatedProductPayload.image_url !== oldProduct.imageUrl) {
          changes.push(t('history.log.image_updated'));
      }

      await logActivity('updated', product, changes.join(', '));
      await fetchData();
      return product;
    } catch (error) {
      alert(t('product_form.error_update', { error: (error as Error).message }));
      return null;
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!supabase) return;
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;
    
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      alert(error.message);
    } else {
      await logActivity('deleted', productToDelete);
      await fetchData();
    }
  };

  const deleteMultipleProducts = async (productIds: number[]) => {
      if (!supabase) return;
      const productsToDelete = products.filter(p => productIds.includes(p.id));

      const { error } = await supabase.from('products').delete().in('id', productIds);
      if (error) {
          alert(error.message);
      } else {
          for (const product of productsToDelete) {
              await logActivity('deleted', product, t('history.log.bulk_delete'));
          }
          await fetchData();
      }
  };

  const duplicateProduct = async (productId: number) => {
    if (!supabase) return;
    const productToDuplicate = products.find(p => p.id === productId);
    if (!productToDuplicate) return;

    const { id, createdAt, updatedAt, ...newProductData } = productToDuplicate;
    newProductData.name = `${newProductData.name} (copie)`;
    
    const result = await addProduct(newProductData);
    if (result) {
        await logActivity('created', result, t('history.log.duplicated', { productName: productToDuplicate.name }));
    }
  };

  const addSale = async (productId: number, quantity: number) => {
    if (!supabase) return;
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return;

    const newStock = product.stock - quantity;
    const { error: stockUpdateError } = await supabase.from('products').update({ stock: newStock, status: newStock > 0 ? 'actif' : 'rupture' }).eq('id', productId);
    
    if (stockUpdateError) {
        alert(stockUpdateError.message);
        return;
    }

    const sale = {
        product_id: productId,
        product_name: product.name,
        quantity: quantity,
        sell_price: product.sellPrice,
        total_price: product.sellPrice * quantity,
        total_margin: (product.sellPrice - product.buyPrice) * quantity,
    };
    const { error: saleInsertError } = await supabase.from('sales').insert(sale);

    if (saleInsertError) {
        alert(saleInsertError.message);
        // Revert stock
        await supabase.from('products').update({ stock: product.stock }).eq('id', productId);
    } else {
        await logActivity('sold', product, t('history.log.units_sold', {quantity}));
        await fetchData();
    }
  };

  const cancelSale = async (saleId: number) => {
      if (!supabase) return;
      const saleToCancel = sales.find(s => s.id === saleId);
      if (!saleToCancel) return;

      const product = products.find(p => p.id === saleToCancel.productId);
      if (!product) return;
      
      const { error: deleteSaleError } = await supabase.from('sales').delete().eq('id', saleId);
      if (deleteSaleError) {
          alert(deleteSaleError.message);
          return;
      }
      
      const newStock = product.stock + saleToCancel.quantity;
      const { error: stockUpdateError } = await supabase.from('products').update({ stock: newStock, status: 'actif' }).eq('id', product.id);
      
      if (stockUpdateError) {
          alert(stockUpdateError.message);
          // Re-insert sale if stock update failed (tricky...)
      } else {
          await logActivity('sale_cancelled', product, t('history.log.sale_cancelled', { quantity: saleToCancel.quantity }));
          await fetchData();
      }
  };

  const value = {
    products, sales, activityLog, theme, language, isLoading, isConfigured, supabase,
    setTheme, setLanguage, t, addProduct, updateProduct, deleteProduct,
    deleteMultipleProducts, duplicateProduct, addSale, cancelSale,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};