export interface Product {
  id: number;
  name: string;
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