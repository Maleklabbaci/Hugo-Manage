import { xanoRequest } from './xano';
import type { Product, Sale, ActivityLog, UserData, Theme, Language, User } from '../types';

const MOCK_PRODUCTS_DATA: Omit<Product, 'id' | 'created_at' | 'owner_id'>[] = [
    { name: "Lunettes de soleil Aviateur", category: "Lunettes", supplier: "SunStyle", buyPrice: 35.00, sellPrice: 89.99, stock: 80, status: "actif", imageUrl: "https://placehold.co/400x400/e0f2fe/083344/Sunglasses" },
    { name: "Montre Chronographe Noire", category: "Montres", supplier: "TimeKeeper", buyPrice: 75.00, sellPrice: 199.99, stock: 45, status: "actif", imageUrl: "https://placehold.co/400x400/e0f2fe/083344/Watch" },
    { name: "Sacoche en cuir", category: "Sacoches & Porte feuille", supplier: "UrbanGear", buyPrice: 40.00, sellPrice: 99.99, stock: 0, status: "rupture", imageUrl: "https://placehold.co/400x400/e0f2fe/083344/Bag" },
    { name: "Casquette de Baseball", category: "Casquette", supplier: "HeadWear", buyPrice: 10.00, sellPrice: 24.99, stock: 120, status: "actif", imageUrl: "https://placehold.co/400x400/e0f2fe/083344/Cap" },
];

export const api = {
    // --- Auth ---
    login: (email, password): Promise<{ authToken: string }> => xanoRequest('/auth/login', 'POST', { email, password }),
    logout: () => localStorage.removeItem('authToken'),
    
    getMe: (): Promise<User> => xanoRequest('/auth/me', 'GET'),

    createUser: async (email, password) => {
        await xanoRequest('/auth/signup', 'POST', { 
          email, 
          password, 
          name: email.split('@')[0] 
        });
        // After signup, Xano backend should ideally populate mock data via a function stack.
        // For frontend-driven demo data:
        const { authToken } = await api.login(email, password);
        localStorage.setItem('authToken', JSON.stringify(authToken)); // Temporarily set token
        
        for (const product of MOCK_PRODUCTS_DATA) {
            await api.addProduct(product);
        }
    },

    // --- Products ---
    getProducts: (): Promise<Product[]> => xanoRequest('/products', 'GET'),
    addProduct: (productData) => xanoRequest('/products', 'POST', productData),
    updateProduct: (id, productData) => xanoRequest(`/products/${id}`, 'PUT', productData),
    deleteProduct: (id) => xanoRequest(`/products/${id}`, 'DELETE'),

    // --- Sales ---
    getSales: (): Promise<Sale[]> => xanoRequest('/sales', 'GET'),
    addSale: (saleData) => xanoRequest('/sales', 'POST', saleData),
    deleteSale: (id) => xanoRequest(`/sales/${id}`, 'DELETE'),

    // --- Activity Log ---
    getActivityLog: (): Promise<ActivityLog[]> => xanoRequest('/activity_logs', 'GET'),
    addActivityLog: (logData) => xanoRequest('/activity_logs', 'POST', logData),

    // --- Data Management ---
    exportData: async (): Promise<UserData> => {
        const [products, sales, activityLog] = await Promise.all([
            api.getProducts(),
            api.getSales(),
            api.getActivityLog()
        ]);
        return { products, sales, activityLog };
    },

    importData: async (data: UserData) => {
        // This requires a specific batch import endpoint in Xano for efficiency.
        // Simulating by individual requests.
        // 1. Clear existing data
        const [currentProducts, currentSales, currentLogs] = await Promise.all([
            api.getProducts(), api.getSales(), api.getActivityLog()
        ]);
        await Promise.all([
            ...currentProducts.map(p => api.deleteProduct(p.id)),
            ...currentSales.map(s => api.deleteSale(s.id)),
        ]);
        // Note: activity logs are usually not deleted/imported.
        
        // 2. Import new data
        await Promise.all(data.products.map(p => api.addProduct(p)));
        await Promise.all(data.sales.map(s => api.addSale(s)));
        await Promise.all(data.activityLog.map(l => api.addActivityLog(l)));
    },
    
    resetData: async () => {
        const [currentProducts, currentSales] = await Promise.all([
            api.getProducts(), api.getSales()
        ]);
        await Promise.all([
            ...currentProducts.map(p => api.deleteProduct(p.id)),
            ...currentSales.map(s => api.deleteSale(s.id)),
        ]);

        for (const product of MOCK_PRODUCTS_DATA) {
            await api.addProduct(product);
        }
    },
    
    // --- Local Settings (Theme, Language) ---
    getTheme: (): Theme => JSON.parse(window.localStorage.getItem('theme') || '"dark"'),
    setTheme: (theme: Theme) => window.localStorage.setItem('theme', JSON.stringify(theme)),

    getLanguage: (): Language => JSON.parse(window.localStorage.getItem('language') || '"fr"'),
    setLanguage: (lang: Language) => window.localStorage.setItem('language', JSON.stringify(lang)),
};