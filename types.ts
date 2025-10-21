export interface Product {
  id: number;
  name: string;
  category: string;
  supplier: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  status: 'actif' | 'rupture';
  updatedAt: string; // ISO string format
  imageUrl?: string;
}

export type Theme = 'light' | 'dark';

export type Language = 'fr' | 'en' | 'ar';