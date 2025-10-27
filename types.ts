import type { Session, User } from '@supabase/supabase-js';

export interface ChatPart {
  text?: string;
  functionCall?: { name: string; args: any; };
  functionResponse?: { name: string; response: any; };
}

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  parts: ChatPart[];
  id: string;
}

// FIX: Renamed Notification to AppNotification to avoid conflict with the built-in browser Notification API.
export interface AppNotification {
  id: number;
  type: 'warning' | 'error';
  message: string;
}


export interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  supplier: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  // Delivery status is now tracked in a separate `deliveries` table.
  status: 'actif' | 'rupture';
  createdAt: string; // ISO string format
  imageUrl?: string;
  ownerId?: string;
}

export type ProductFormData = Omit<Product, 'id' | 'status' | 'createdAt'> & {
  imageFile?: File | null;
};


export interface ActivityLog {
  id: number;
  productId: number;
  productName: string;
  action: 'created' | 'updated' | 'deleted' | 'sold' | 'sale_cancelled' | 'delivery_set' | 'delivery_confirmed' | 'delivery_cancelled';
  details?: string;
  createdAt: string; // ISO string format
  ownerId?: string;
}

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  sellPrice: number;
  totalPrice: number;
  totalMargin: number;
  createdAt: string; // ISO string format
  ownerId?: string;
}

export interface Delivery {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    sellPrice: number;
    buyPrice: number;
    imageUrl?: string;
    createdAt: string;
    ownerId?: string;
}

export type Theme = 'light' | 'dark';

export type Language = 'fr' | 'en' | 'ar';

export type BulkUpdateMode = 'set' | 'increase' | 'decrease';

// FIX: Corrected and completed the BulkUpdatePayload interface.
export interface BulkUpdatePayload {
  category?: string;
  supplier?: string;
  buyPrice?: { mode: BulkUpdateMode; value: number };
  sellPrice?: { mode: BulkUpdateMode; value: number };
  stock?: { mode: BulkUpdateMode; value: number };
}

// FIX: Added AIInsight interface for Gemini AI features.
export interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
}

// FIX: Added and exported AppContextType for useAppContext hook.
export interface AppContextType {
  products: Product[];
  sales: Sale[];
  deliveries: Delivery[];
  activityLog: ActivityLog[];
  notifications: AppNotification[];
  theme: Theme;
  language: Language;
  isLoading: boolean;
  isConfigured: boolean;
  session: Session | null;
  user: User | null;
  setTheme: (newTheme: Theme) => void;
  setLanguage: (newLanguage: Language) => void;
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
  setProductToDelivery: (productId: number, quantity: number) => Promise<void>;
  confirmSaleFromDelivery: (deliveryId: number) => Promise<void>;
  cancelDelivery: (deliveryId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
  markNotificationAsRead: (productId: number) => void;
  markAllNotificationsAsRead: () => void;
  saveSupabaseCredentials: (url: string, anonKey: string) => void;
  refetchData: () => Promise<void>;
  findProductByName: (name: string) => Product[];
  findProductsByKeywords: (keywords: string) => Product[];
}