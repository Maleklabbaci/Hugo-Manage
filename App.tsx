import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Delivery from './pages/Delivery';
import Settings from './pages/Settings';
import Sales from './pages/Sales';
import Layout from './components/Layout';
import { LoaderIcon } from './components/Icons';
import LoadingScreen from './components/LoadingScreen';
import MobileHub from './pages/MobileHub';

// This wrapper protects routes that require a logged-in user.
const AuthWrapper: React.FC = () => {
    const { session, isLoading } = useAppContext();

    if (isLoading) {
       return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-dark">
                <LoaderIcon className="w-12 h-12 animate-spin text-cyan-500" />
            </div>
        );
    }
    
    // If there's no session, redirect to the login page.
    if (!session) {
        return <Navigate to="/login" replace />;
    }
    
    // If logged in, render the child routes (e.g., Dashboard, Products).
    return <Outlet />;
};

const AppRoutes: React.FC = () => {
    const { session } = useAppContext();
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Routes with the main Layout */}
                <Route element={<Layout />}>
                    {/* Settings page is public to allow Supabase configuration */}
                    <Route path="/settings" element={<Settings />} />

                    {/* All other routes are protected by the AuthWrapper */}
                    <Route element={<AuthWrapper />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/delivery" element={<Delivery />} />
                        <Route path="/sales" element={<Sales />} />
                    </Route>
                </Route>
                
                 {/* Mobile-only hub route, protected */}
                 <Route element={<AuthWrapper />}>
                    <Route path="/mobile-hub" element={<MobileHub />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </HashRouter>
    );
};

const AppContent: React.FC = () => {
    const { isLoading, isConfigured } = useAppContext();

    // Show a global loader only on the initial app load when Supabase is configured
    if (isLoading && isConfigured) {
        return <LoadingScreen />;
    }
    
    return <AppRoutes />;
}

const App: React.FC = () => {
  return (
    <AppProvider>
        <AppContent />
    </AppProvider>
  );
};

export default App;
