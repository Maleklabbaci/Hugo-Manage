// Base Xano record structure
interface XanoRecord {
  id: number;
  created_at: number; // Unix timestamp in ms
}

export interface Product extends XanoRecord {
  name: string;
  category: string;
  supplier: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  status: 'actif' | 'rupture';
  imageUrl?: string;
  owner_id: number; // Relation to users table
  updated_at?: number;
}

export interface ActivityLog extends XanoRecord {
  product_name: string;
  action: 'created' | 'updated' | 'deleted' | 'sold' | 'sale_cancelled';
  details?: string;
  timestamp: number; // Unix timestamp in ms
  owner_id: number;
  product_id?: number; // Relation to products table
}

export interface Sale extends XanoRecord {
  product_name: string;
  quantity: number;
  sellPrice: number;
  totalPrice: number;
  totalMargin: number;
  timestamp: number; // Unix timestamp in ms
  owner_id: number;
  product_id: number; // Relation to products table
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export type Theme = 'light' | 'dark';

export type Language = 'fr' | 'en' | 'ar';

export interface UserData {
  products: Product[];
  activityLog: ActivityLog[];
  sales: Sale[];
}