import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Product, Theme, Language, ActivityLog, Sale, BulkUpdatePayload, BulkUpdateMode } from '../types';
import { storage } from '../services/storage';
import { translations } from '../translations';
import { MOCK_PRODUCTS } from '../mock/products';

export interface Notification {
  id: number; // product id
  type: 'warning' | 'error';
  message: string;
}

/*
-- =================================================================
-- SCRIPT SQL DE SÉCURITÉ - À EXÉCUTER DANS SUPABASE
-- =================================================================
--
-- !! ATTENTION !!
-- POUR QUE LA CONNEXION ET LA SÉCURITÉ DES DONNÉES FONCTIONNENT,
-- VOUS DEVEZ EXÉCUTER CE SCRIPT SQL DANS VOTRE ÉDITEUR SQL SUPABASE.
--
-- CE SCRIPT N'EFFACE PAS VOS DONNÉES.
-- Il ajoute la sécurité pour que chaque utilisateur ne voie que ses propres données.
--
-- =================================================================

-- 1. Activer la Sécurité au Niveau des Lignes (Row Level Security - RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 2. Créer les politiques de sécurité pour que chaque utilisateur gère SES propres données
-- Supprime les anciennes politiques si elles existent pour éviter les conflits
DROP POLICY IF EXISTS "Users can manage their own products" ON products;
DROP POLICY IF EXISTS "Users can manage their own sales" ON sales;
DROP POLICY IF EXISTS "Users can manage their own activity logs" ON activity_log;

-- Crée les nouvelles politiques
CREATE POLICY "Users can manage their own products" ON products FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own sales" ON sales FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own activity logs" ON activity_log FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
*/


interface AppContextType {
  products: Product[];
  sales: Sale[];
  activityLog: ActivityLog[];
  notifications: Notification[];
  theme: Theme;
  language: Language;
  isLoading: boolean;
  isConfigured: boolean;
  supabase: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  login: (email: string, pass: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'status' | 'createdAt'>) => Promise<Product | null>;
  addMultipleProducts: (productsData: Omit<Product, 'id' | 'status' | 'createdAt'>[]) => Promise<void>;
  updateProduct: (product: Product) => Promise<Product | null>;
  updateMultipleProducts: (productIds: number[], updates: BulkUpdatePayload) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  deleteMultipleProducts: (productIds: number[]) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
  markNotificationAsRead: (productId: number) => void;
  markAllNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [theme, rawSetTheme] = useState<Theme>(storage.getTheme());
  const [language, rawSetLanguage] = useState<Language>(storage.getLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);

  useEffect(() => {
    const { supabaseUrl, supabaseAnonKey } = storage.getSupabaseCredentials();
    if (supabaseUrl && supabaseAnonKey) {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      setSupabase(client);
      setIsConfigured(true);

      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
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
    
  const notifications = useMemo(() => {
    const lowStockAlerts = products
      .filter(p => p.stock > 0 && p.stock <= 5 && !readNotificationIds.includes(p.id))
      .map(p => ({
        id: p.id,
        type: 'warning' as const,
        message: t('dashboard.notifications.low_stock', { productName: p.name, count: p.stock }),
      }));

    const outOfStockAlerts = products
      .filter(p => p.stock === 0 && !readNotificationIds.includes(p.id))
      .map(p => ({
        id: p.id,
        type: 'error' as const,
        message: t('dashboard.notifications.out_of_stock', { productName: p.name }),
      }));
    
    return [...outOfStockAlerts, ...lowStockAlerts];
  }, [products, readNotificationIds, t]);

  const markNotificationAsRead = (productId: number) => {
    setReadNotificationIds(prev => [...new Set([...prev, productId])]);
  };

  const markAllNotificationsAsRead = () => {
    const allCurrentIds = notifications.map(n => n.id);
    setReadNotificationIds(prev => [...new Set([...prev, ...allCurrentIds])]);
  };

  const fetchData = useCallback(async () => {
    if (!supabase || !session) return;
    setIsLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productsError) throw productsError;

      const { data: salesData, error: salesError } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (salesError) throw salesError;

      const { data: logData, error: logError } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false });
      if (logError) throw logError;

      setProducts((productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name || '',
        category: p.category || '',
        supplier: p.supplier || '',
        buyPrice: p.buyprice ?? 0,
        sellPrice: p.sellprice ?? 0,
        stock: p.stock ?? 0,
        status: p.status || ((p.stock ?? 0) > 0 ? 'actif' : 'rupture'),
        createdAt: p.created_at,
        imageUrl: p.imageurl,
        ownerId: p.owner_id
      })));
      setSales((salesData || []).map((s: any) => ({
        id: s.id,
        productId: s.product_id,
        productName: s.productname || '',
        quantity: s.quantity ?? 0,
        sellPrice: s.sellprice ?? 0,
        totalPrice: s.totalprice ?? 0,
        totalMargin: s.totalmargin ?? 0,
        createdAt: s.created_at,
        ownerId: s.owner_id
      })));
      setActivityLog((logData || []).map((l: any) => ({
        id: l.id,
        productId: l.product_id,
        productName: l.productname || '',
        action: l.action,
        details: l.details,
        createdAt: l.created_at,
        ownerId: l.owner_id
      })));

    } catch (error) {
        let errorMessage = (error as Error).message;
        if (errorMessage.includes("permission denied for table")) {
             errorMessage = t('error.rls_permission_denied');
        }
        console.error("Error fetching data:", error);
        alert(t('error.fetch_data', { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, session, t]);

  useEffect(() => {
    if (isConfigured && session) {
      fetchData();
    } else if (!session) {
        setIsLoading(false);
        setProducts([]);
        setSales([]);
        setActivityLog([]);
    }
  }, [isConfigured, session, fetchData]);

  const login = async (email: string, pass: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };
  
  const logActivity = async (action: ActivityLog['action'], product: { id: number; name: string; }, details?: string) => {
    if (!supabase || !user) return;
    const { error } = await supabase.from('activity_log').insert({
      product_id: product.id,
      productname: product.name,
      action: action,
      details: details || null,
      owner_id: user.id,
    });
    if (error) console.error("Error logging activity:", error);
  };
  
  const addProduct = async (productData: Omit<Product, 'id' | 'status' | 'createdAt' >): Promise<Product | null> => {
    if (!supabase || !user) return null;
    try {
      const newProductPayload = {
        name: productData.name, category: productData.category, supplier: productData.supplier,
        buyprice: productData.buyPrice, sellprice: productData.sellPrice, stock: productData.stock,
        imageurl: productData.imageUrl, status: productData.stock > 0 ? 'actif' : 'rupture',
        owner_id: user.id
      };
      const { data, error } = await supabase.from('products').insert(newProductPayload).select().single();
      if (error) throw error;
      
      const createdProduct = { ...productData, id: data.id, status: newProductPayload.status as ('actif' | 'rupture'), createdAt: data.created_at };
      await logActivity('created', createdProduct);
      await fetchData();
      return createdProduct;
    } catch (error) {
      alert(t('product_form.error_add', { error: (error as Error).message }));
      return null;
    }
  };

  const addMultipleProducts = async (productsData: Omit<Product, 'id' | 'status' | 'createdAt'>[]) => {
    if (!supabase || !user) return;
    try {
        const newProductsPayload = productsData.map(p => ({
            name: p.name,
            category: p.category,
            supplier: p.supplier,
            buyprice: p.buyPrice,
            sellprice: p.sellPrice,
            stock: p.stock,
            imageurl: p.imageUrl,
            status: p.stock > 0 ? 'actif' : 'rupture',
            owner_id: user.id
        }));

        const { data, error } = await supabase.from('products').insert(newProductsPayload).select();
        if (error) throw error;
        
        if (data) {
            for (const newProduct of data) {
                await logActivity('created', {id: newProduct.id, name: newProduct.name}, t('history.log.imported_from_shopify'));
            }
        }
        await fetchData();
    } catch (error) {
        alert(t('product_form.error_add', { error: (error as Error).message }));
    }
  };

  const updateProduct = async (product: Product): Promise<Product | null> => {
    if (!supabase) return null;
    const oldProduct = products.find(p => p.id === product.id);
    if (!oldProduct) return null;

    try {
      const updatedProductPayload = {
        name: product.name, category: product.category, supplier: product.supplier,
        buyprice: product.buyPrice, sellprice: product.sellPrice, stock: product.stock,
        imageurl: product.imageUrl, status: product.stock > 0 ? 'actif' : 'rupture',
      };
      const { data, error } = await supabase.from('products').update(updatedProductPayload).eq('id', product.id).select().single();
      if (error) throw error;
      
      const changes: string[] = [];
      const keysToCompare: (keyof Omit<Product, 'id'|'createdAt'|'status'|'imageUrl'|'ownerId'>)[] = ['name', 'category', 'supplier', 'buyPrice', 'sellPrice', 'stock'];
      keysToCompare.forEach(key => {
        if(oldProduct[key] !== product[key]) {
            changes.push(`${t('log.' + key)}: "${oldProduct[key]}" -> "${product[key]}"`);
        }
      });
      if (product.imageUrl !== oldProduct.imageUrl) {
          changes.push(t('history.log.image_updated'));
      }
      if (changes.length > 0) {
        await logActivity('updated', product, changes.join(', '));
      }

      await fetchData();
      return product;
    } catch (error) {
      alert(t('product_form.error_update', { error: (error as Error).message }));
      return null;
    }
  };

  const calculateNewValue = (currentValue: number, mode: BulkUpdateMode, changeValue: number): number => {
    switch (mode) {
        case 'set': return changeValue;
        case 'increase': return currentValue + changeValue;
        case 'decrease': return currentValue - changeValue;
        default: return currentValue;
    }
  };

  const updateMultipleProducts = async (productIds: number[], updates: BulkUpdatePayload) => {
    if (!supabase || !user) return;

    const productsToUpdate = products.filter(p => productIds.includes(p.id));
    if (productsToUpdate.length === 0) return;

    try {
        for (const product of productsToUpdate) {
            const payload: any = {};
            const changes: string[] = [];
            
            if (updates.category) {
                payload.category = updates.category;
                changes.push(`${t('log.category')}: "${product.category}" -> "${updates.category}"`);
            }
            if (updates.supplier) {
                payload.supplier = updates.supplier;
                changes.push(`${t('log.supplier')}: "${product.supplier}" -> "${updates.supplier}"`);
            }
            if (updates.buyPrice) {
                const newValue = calculateNewValue(product.buyPrice, updates.buyPrice.mode, updates.buyPrice.value);
                payload.buyprice = newValue;
                changes.push(`${t('log.buyPrice')}: "${product.buyPrice}" -> "${newValue.toFixed(2)}"`);
            }
            if (updates.sellPrice) {
                const newValue = calculateNewValue(product.sellPrice, updates.sellPrice.mode, updates.sellPrice.value);
                payload.sellprice = newValue;
                changes.push(`${t('log.sellPrice')}: "${product.sellPrice}" -> "${newValue.toFixed(2)}"`);
            }
            if (updates.stock) {
                const newValue = calculateNewValue(product.stock, updates.stock.mode, updates.stock.value);
                payload.stock = Math.max(0, Math.floor(newValue)); // Stock must be integer and can't be negative
                payload.status = payload.stock > 0 ? 'actif' : 'rupture';
                changes.push(`${t('log.stock')}: "${product.stock}" -> "${payload.stock}"`);
            }
            
            if (Object.keys(payload).length > 0) {
                 const { error } = await supabase.from('products').update(payload).eq('id', product.id);
                 if (error) throw error;
                 await logActivity('updated', product, `${t('history.log.bulk_update')}: ${changes.join(', ')}`);
            }
        }
        await fetchData();
    } catch (error) {
        alert(t('bulk_edit_form.error', { error: (error as Error).message }));
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

    const { id, createdAt, ...newProductData } = productToDuplicate;
    newProductData.name = `${newProductData.name} (copie)`;
    
    const result = await addProduct(newProductData);
    if (result) {
        await logActivity('created', result, t('history.log.duplicated', { productName: productToDuplicate.name }));
    }
  };

  const addSale = async (productId: number, quantity: number) => {
    if (!supabase || !user) return;
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
        productname: product.name,
        quantity: quantity,
        sellprice: product.sellPrice,
        totalprice: product.sellPrice * quantity,
        totalmargin: (product.sellPrice - product.buyPrice) * quantity,
        owner_id: user.id,
    };
    const { error: saleInsertError } = await supabase.from('sales').insert(sale);

    if (saleInsertError) {
        alert(saleInsertError.message);
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

    // First, try to delete the sale record. This is the primary action.
    const { error: deleteSaleError } = await supabase.from('sales').delete().eq('id', saleId);

    if (deleteSaleError) {
      alert(deleteSaleError.message);
      return; // If we can't delete the sale, stop here.
    }

    // If sale deletion is successful, then handle product stock.
    const product = products.find(p => p.id === saleToCancel.productId);

    if (product) {
      // Product exists, so try to restore stock.
      const newStock = product.stock + saleToCancel.quantity;
      const { error: stockUpdateError } = await supabase.from('products').update({ stock: newStock, status: 'actif' }).eq('id', product.id);

      if (stockUpdateError) {
        alert(t('sales.error_restoring_stock'));
      } else {
        await logActivity('sale_cancelled', product, t('history.log.sale_cancelled', { quantity: saleToCancel.quantity }));
      }
    } else {
      // Product does not exist. The sale is cancelled, but we can't restore stock.
      await logActivity('sale_cancelled', { id: saleToCancel.productId, name: saleToCancel.productName }, t('history.log.sale_cancelled_deleted_product'));
    }
    
    // In all successful cancellation scenarios, refresh the data.
    await fetchData();
  };

  const value = {
    products, sales, activityLog, theme, language, isLoading, isConfigured, supabase,
    session, user, notifications, setTheme, setLanguage, t, login, logout,
    addProduct, addMultipleProducts, updateProduct, updateMultipleProducts, deleteProduct, deleteMultipleProducts, 
    duplicateProduct, addSale, cancelSale, markNotificationAsRead, markAllNotificationsAsRead,
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
