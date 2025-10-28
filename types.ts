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
  status: 'actif' | 'rupture' | 'en livraison';
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
  action: 'created' | 'updated' | 'deleted' | 'sold' | 'sale_cancelled' | 'delivery_set' | 'delivery_cancelled';
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

export type Theme = 'light' | 'dark';

export type Language = 'fr' | 'en' | 'ar';

export type BulkUpdateMode = 'set' | 'increase' | 'decrease';

export interface BulkUpdatePayload {
  category?: string;
  supplier?: string;
  buyPrice?: { mode: BulkUpdateMode; value: number };
  sellPrice?: { mode: BulkUpdateMode; value: number };
  stock?: { mode: BulkUpdateMode; value: number };
}

export interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
}

export interface AppContextType {
  products: Product[];
  sales: Sale[];
  activityLog: ActivityLog[];
  // FIX: Use the custom AppNotification type to resolve type errors.
  notifications: AppNotification[];
  theme: Theme;
  language: Language;
  isLoading: boolean;
  isConfigured: boolean;
  session: any; // Using `any` for Supabase Session type for simplicity
  user: any; // Using `any` for Supabase User type for simplicity
  isVisualSearchOpen: boolean;
  productDataForForm: (ProductFormData & { imageBlob?: Blob }) | null;
  visualSearchQuery: string | null;
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
  setProductToDelivery: (productId: number) => Promise<void>;
  confirmSaleFromDelivery: (productId: number) => Promise<void>;
  cancelDelivery: (productId: number) => Promise<void>;
  addSale: (productId: number, quantity: number) => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
  markNotificationAsRead: (productId: number) => void;
  markAllNotificationsAsRead: () => void;
  saveSupabaseCredentials: (url: string, anonKey: string) => void;
  saveGeminiApiKey: (key: string) => void;
  refetchData: () => Promise<void>;
  findProductByName: (name: string) => Product[];
  findProductsByKeywords: (keywords: string) => Product[];
  testSupabaseConnection: () => Promise<{ success: boolean; error?: string; dbOk?: boolean; storageOk?: boolean; }>;
  openVisualSearch: () => void;
  closeVisualSearch: () => void;
  setProductDataForForm: (data: (ProductFormData & { imageBlob?: Blob }) | null) => void;
  setVisualSearchQuery: (query: string | null) => void;
}