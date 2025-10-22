import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import History from './pages/History';
import Sales from './pages/Sales';
import Layout from './components/Layout';
import { LoaderIcon } from './components/Icons';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-dark">
                <LoaderIcon className="w-12 h-12 animate-spin text-accent" />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return <Layout />;
};

const AppRoutes: React.FC = () => {
    const { isLoading } = useAuth();

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={isLoading ? <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-dark"><LoaderIcon className="w-12 h-12 animate-spin text-accent" /></div> : <ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </HashRouter>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <AppProvider>
            <AppRoutes />
        </AppProvider>
    </AuthProvider>
  );
};

export default App;