import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import type { Product, Theme, Language, ActivityLog, Sale, BulkUpdatePayload, BulkUpdateMode, ProductFormData } from '../types';
import { storage } from '../services/storage';
import { translations } from '../translations';
import { MOCK_PRODUCTS } from '../mock/products';
import { supabaseClient, uploadImage, deleteImage } from '../services/supabase';

export interface Notification {
  id: number; // product id
  type: 'warning' | 'error';
  message: string;
}

const mapSupabaseRecordToProduct = (p: any): Product => ({
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
});

interface AppContextType {
  products: Product[];
  sales: Sale[];
  activityLog: ActivityLog[];
  notifications: Notification[];
  theme: Theme;
  language: Language;
  isLoading: boolean;
  isConfigured: boolean;
  session: Session | null;
  user: User | null;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  login: (email: string, pass: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  addProduct: (productData: ProductFormData) => Promise<Product | null>;
  addMultipleProducts: (productsData: Omit<Product, 'id' | 'status' | 'createdAt'>[]) => Promise<void>;
  updateProduct: (product: Product, productData: ProductFormData) => Promise<Product | null>;
  updateMultipleProducts: (productIds: number[], updates: BulkUpdatePayload) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  deleteMultipleProducts: (productIds: number[]) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
  markNotificationAsRead: (productId: number) => void;
  markAllNotificationsAsRead: () => void;
  saveSupabaseCredentials: (url: string, anonKey: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [theme, rawSetTheme] = useState<Theme>(storage.getTheme());
  const [language, rawSetLanguage] = useState<Language>(storage.getLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);
  const isConfigured = !!supabaseClient;

  useEffect(() => {
    if (supabaseClient) {
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
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
    if (!supabaseClient || !session) return;
    setIsLoading(true);
    try {
      const [productsRes, salesRes, logRes] = await Promise.all([
        supabaseClient.from('products').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('sales').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('activity_log').select('*').order('created_at', { ascending: false })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (logRes.error) throw logRes.error;

      setProducts(productsRes.data.map(mapSupabaseRecordToProduct));
      setSales((salesRes.data || []).map((s: any) => ({
        id: s.id, productId: s.product_id, productName: s.productname || '', quantity: s.quantity ?? 0,
        sellPrice: s.sellprice ?? 0, totalPrice: s.totalprice ?? 0, totalMargin: s.totalmargin ?? 0,
        createdAt: s.created_at, ownerId: s.owner_id
      })));
      setActivityLog((logRes.data || []).map((l: any) => ({
        id: l.id, productId: l.product_id, productName: l.productname || '', action: l.action,
        details: l.details, createdAt: l.created_at, ownerId: l.owner_id
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
  }, [session, t]);

  useEffect(() => {
    if (supabaseClient && session) {
      fetchData();
    } else if (!session) {
        setIsLoading(false);
        setProducts([]);
        setSales([]);
        setActivityLog([]);
    }
  }, [session, fetchData]);

  const login = async (email: string, pass: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not configured") };
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const logout = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
  };
  
  const logActivity = useCallback(async (action: ActivityLog['action'], product: { id: number; name: string; }, details?: string) => {
    if (!supabaseClient || !user) return;
    const logData = {
      product_id: product.id, productname: product.name, action: action,
      details: details || null, owner_id: user.id,
    };
    const { data, error } = await supabaseClient.from('activity_log').insert(logData).select().single();
    if (error) console.error("Error logging activity:", error);
    else if (data) {
      setActivityLog(prev => [{
          id: data.id, productId: data.product_id, productName: data.productname, action: data.action,
          details: data.details, createdAt: data.created_at, ownerId: data.owner_id
      }, ...prev]);
    }
  }, [user]);
  
  const addProduct = async (productData: ProductFormData): Promise<Product | null> => {
    if (!supabaseClient || !user) return null;
    try {
      let imageUrl = productData.imageUrl;
      if (productData.imageFile) {
        imageUrl = await uploadImage(productData.imageFile, user.id);
      }

      const newProductPayload = {
        name: productData.name, category: productData.category, supplier: productData.supplier,
        buyprice: productData.buyPrice, sellprice: productData.sellPrice, stock: productData.stock,
        imageurl: imageUrl, status: productData.stock > 0 ? 'actif' : 'rupture',
        owner_id: user.id
      };
      const { data, error } = await supabaseClient.from('products').insert(newProductPayload).select().single();
      if (error) throw error;
      
      const createdProduct = mapSupabaseRecordToProduct(data);
      setProducts(prev => [createdProduct, ...prev]);
      await logActivity('created', createdProduct);
      return createdProduct;
    } catch (error) {
      alert(t('product_form.error_add', { error: (error as Error).message }));
      return null;
    }
  };

  const addMultipleProducts = async (productsData: Omit<Product, 'id' | 'status' | 'createdAt'>[]) => {
    if (!supabaseClient || !user) return;
    try {
        const newProductsPayload = productsData.map(p => ({
            name: p.name, category: p.category, supplier: p.supplier, buyprice: p.buyPrice,
            sellprice: p.sellPrice, stock: p.stock, imageurl: p.imageUrl,
            status: p.stock > 0 ? 'actif' : 'rupture', owner_id: user.id
        }));

        const { data, error } = await supabaseClient.from('products').insert(newProductsPayload).select();
        if (error) throw error;
        
        if (data) {
          const createdProducts = data.map(mapSupabaseRecordToProduct);
          setProducts(prev => [...createdProducts, ...prev]);
          for (const newProduct of createdProducts) {
              await logActivity('created', {id: newProduct.id, name: newProduct.name}, t('history.log.imported_from_shopify'));
          }
        }
    } catch (error) {
        alert(t('product_form.error_add', { error: (error as Error).message }));
    }
  };

  const updateProduct = async (product: Product, productData: ProductFormData): Promise<Product | null> => {
    if (!supabaseClient) return null;
    try {
      let imageUrl = product.imageUrl;
      if (productData.imageFile) {
        if (product.imageUrl) await deleteImage(product.imageUrl);
        imageUrl = await uploadImage(productData.imageFile, product.ownerId!);
      }

      const updatedProductPayload = {
        name: productData.name, category: productData.category, supplier: productData.supplier,
        buyprice: productData.buyPrice, sellprice: productData.sellPrice, stock: productData.stock,
        imageurl: imageUrl, status: productData.stock > 0 ? 'actif' : 'rupture',
      };
      const { data, error } = await supabaseClient.from('products').update(updatedProductPayload).eq('id', product.id).select().single();
      if (error) throw error;
      
      const updatedProduct = mapSupabaseRecordToProduct(data);
      setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));

      const changes: string[] = [];
      const keysToCompare: (keyof Omit<Product, 'id'|'createdAt'|'status'|'imageUrl'|'ownerId'>)[] = ['name', 'category', 'supplier', 'buyPrice', 'sellPrice', 'stock'];
      keysToCompare.forEach(key => {
        if (product[key] !== updatedProduct[key]) {
          changes.push(`${t('log.' + key)}: "${product[key]}" -> "${updatedProduct[key]}"`);
        }
      });
      if (imageUrl !== product.imageUrl) {
          changes.push(t('history.log.image_updated'));
      }
      if (changes.length > 0) {
        await logActivity('updated', updatedProduct, changes.join(', '));
      }
      return updatedProduct;
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
    if (!supabaseClient || !user) return;
    const productsToUpdate = products.filter(p => productIds.includes(p.id));
    if (productsToUpdate.length === 0) return;
    
    try {
      const updatedProductsLocally: Product[] = [];
      for (const product of productsToUpdate) {
          const payload: any = {};
          const changes: string[] = [];
          
          if (updates.category) { payload.category = updates.category; changes.push(`${t('log.category')}: "${product.category}" -> "${updates.category}"`); }
          if (updates.supplier) { payload.supplier = updates.supplier; changes.push(`${t('log.supplier')}: "${product.supplier}" -> "${updates.supplier}"`); }
          if (updates.buyPrice) { const newValue = calculateNewValue(product.buyPrice, updates.buyPrice.mode, updates.buyPrice.value); payload.buyprice = newValue; changes.push(`${t('log.buyPrice')}: "${product.buyPrice}" -> "${newValue.toFixed(2)}"`); }
          if (updates.sellPrice) { const newValue = calculateNewValue(product.sellPrice, updates.sellPrice.mode, updates.sellPrice.value); payload.sellprice = newValue; changes.push(`${t('log.sellPrice')}: "${product.sellPrice}" -> "${newValue.toFixed(2)}"`); }
          if (updates.stock) {
              const newValue = calculateNewValue(product.stock, updates.stock.mode, updates.stock.value);
              payload.stock = Math.max(0, Math.floor(newValue));
              payload.status = payload.stock > 0 ? 'actif' : 'rupture';
              changes.push(`${t('log.stock')}: "${product.stock}" -> "${payload.stock}"`);
          }
          
          if (Object.keys(payload).length > 0) {
              const { data, error } = await supabaseClient.from('products').update(payload).eq('id', product.id).select().single();
              if (error) throw error;
              updatedProductsLocally.push(mapSupabaseRecordToProduct(data));
              await logActivity('updated', product, `${t('history.log.bulk_update')}: ${changes.join(', ')}`);
          }
      }
      setProducts(prev => prev.map(p => {
          const updatedVersion = updatedProductsLocally.find(up => up.id === p.id);
          return updatedVersion || p;
      }));
    } catch (error) {
        alert(t('bulk_edit_form.error', { error: (error as Error).message }));
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!supabaseClient) return;
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;
    
    const { error } = await supabaseClient.from('products').delete().eq('id', productId);
    if (error) {
      alert(error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
      if (productToDelete.imageUrl) await deleteImage(productToDelete.imageUrl);
      await logActivity('deleted', productToDelete);
    }
  };

  const deleteMultipleProducts = async (productIds: number[]) => {
      if (!supabaseClient) return;
      const productsToDelete = products.filter(p => productIds.includes(p.id));

      const { error } = await supabaseClient.from('products').delete().in('id', productIds);
      if (error) {
          alert(error.message);
      } else {
          setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
          for (const product of productsToDelete) {
              if (product.imageUrl) await deleteImage(product.imageUrl);
              await logActivity('deleted', product, t('history.log.bulk_delete'));
          }
      }
  };

  const duplicateProduct = async (productId: number) => {
    const productToDuplicate = products.find(p => p.id === productId);
    if (!productToDuplicate) return;

    const { id, createdAt, ownerId, ...newProductData } = productToDuplicate;
    const duplicatedProductData = {
      ...newProductData,
      name: `${newProductData.name} (copie)`,
      imageFile: null
    };
    
    const result = await addProduct(duplicatedProductData as ProductFormData);
    if (result) {
        await logActivity('created', result, t('history.log.duplicated', { productName: productToDuplicate.name }));
    }
  };

  const addSale = async (productId: number, quantity: number) => {
    if (!supabaseClient || !user) return;
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return;

    const newStock = product.stock - quantity;
    const { data: updatedProductData, error: stockUpdateError } = await supabaseClient.from('products')
      .update({ stock: newStock, status: newStock > 0 ? 'actif' : 'rupture' })
      .eq('id', productId).select().single();
    
    if (stockUpdateError) { alert(stockUpdateError.message); return; }

    const salePayload = {
        product_id: productId, productname: product.name, quantity: quantity, sellprice: product.sellPrice,
        totalprice: product.sellPrice * quantity, totalmargin: (product.sellPrice - product.buyPrice) * quantity,
        owner_id: user.id,
    };
    const { data: saleData, error: saleInsertError } = await supabaseClient.from('sales').insert(salePayload).select().single();

    if (saleInsertError) {
        alert(saleInsertError.message);
        await supabaseClient.from('products').update({ stock: product.stock }).eq('id', productId);
    } else {
        const updatedProduct = mapSupabaseRecordToProduct(updatedProductData);
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        setSales(prev => [saleData, ...prev]);
        await logActivity('sold', product, t('history.log.units_sold', {quantity}));
    }
  };

  const cancelSale = async (saleId: number) => {
    if (!supabaseClient) return;
    const saleToCancel = sales.find(s => s.id === saleId);
    if (!saleToCancel) return;

    const { error: deleteSaleError } = await supabaseClient.from('sales').delete().eq('id', saleId);
    if (deleteSaleError) { alert(deleteSaleError.message); return; }

    setSales(prev => prev.filter(s => s.id !== saleId));
    
    const product = products.find(p => p.id === saleToCancel.productId);
    if (product) {
      const newStock = product.stock + saleToCancel.quantity;
      const { data, error: stockUpdateError } = await supabaseClient.from('products')
        .update({ stock: newStock, status: 'actif' }).eq('id', product.id).select().single();

      if (stockUpdateError) {
        alert(t('sales.error_restoring_stock'));
      } else {
        const updatedProduct = mapSupabaseRecordToProduct(data);
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        await logActivity('sale_cancelled', product, t('history.log.sale_cancelled', { quantity: saleToCancel.quantity }));
      }
    } else {
      await logActivity('sale_cancelled', { id: saleToCancel.productId, name: saleToCancel.productName }, t('history.log.sale_cancelled_deleted_product'));
    }
  };

  const saveSupabaseCredentials = (url: string, anonKey: string) => {
    storage.setSupabaseCredentials(url, anonKey);
    alert(t('settings.supabase.saved_message'));
    window.location.reload();
  };

  const value = {
    products, sales, activityLog, theme, language, isLoading,
    session, user, notifications, setTheme, setLanguage, t, login, logout,
    addProduct, addMultipleProducts, updateProduct, updateMultipleProducts, deleteProduct, deleteMultipleProducts, 
    duplicateProduct, addSale, cancelSale, markNotificationAsRead, markAllNotificationsAsRead,
    isConfigured, saveSupabaseCredentials,
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
