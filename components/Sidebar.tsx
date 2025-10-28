import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DashboardIcon, ProductsIcon, SettingsIcon, HistoryIcon, ShoppingCartIcon, ChezHugoLogo, DeliveryIcon, StatsIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

// Reusable NavItem for both sidebar and bottom nav
const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string; count?: number; isMobile?: boolean }> = ({ to, icon: Icon, label, count, isMobile }) => {
    const location = useLocation();
    // For bottom nav, we want to match the base path
    const isActive = location.pathname.startsWith(to);

    if (isMobile) {
        return (
            <NavLink
                to={to}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors duration-200 relative ${
                    isActive ? 'text-brand' : 'text-slate-400 hover:text-brand-light'
                }`}
            >
                <div className="relative">
                    <Icon className="w-6 h-6 mb-1" />
                    {typeof count !== 'undefined' && count > 0 && (
                        <span className="absolute -top-1 -right-2 bg-brand text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </div>
                <span className="text-xs font-medium tracking-tight">{label}</span>
            </NavLink>
        );
    }

    // Desktop
    return (
        <NavLink
            to={to}
            end={to==="/dashboard"}
            className={({isActive}) => `relative flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive ? 'font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
        >
            {({isActive}) => isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand rounded-r-full" />}
            <Icon className="w-5 h-5 me-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1 text-sm">{label}</span>
            {typeof count !== 'undefined' && count > 0 && (
                <span className="bg-brand/20 text-brand-light text-xs font-semibold px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </NavLink>
    );
};


const Sidebar: React.FC = () => {
  const { t, language, products, sales } = useAppContext();
  const isRtl = language === 'ar';
  
  const navLinks = [
    { to: "/dashboard", icon: DashboardIcon, label: t('sidebar.dashboard') },
    { to: "/products", icon: ProductsIcon, label: t('sidebar.products'), count: products.filter(p => p.status !== 'en livraison').length },
    { to: "/delivery", icon: DeliveryIcon, label: t('sidebar.delivery'), count: products.filter(p => p.status === 'en livraison').length },
    { to: "/sales", icon: ShoppingCartIcon, label: t('sidebar.sales'), count: sales.length },
    { to: "/statistics", icon: StatsIcon, label: t('sidebar.statistics') },
    { to: "/history", icon: HistoryIcon, label: t('sidebar.history') },
    { to: "/settings", icon: SettingsIcon, label: t('sidebar.settings') },
  ];
  
  const mobileNavLinks = navLinks.filter(l => !('desktopOnly' in l));
  const desktopNavLinks = navLinks;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 h-full bg-slate-900 border-r border-slate-800 text-white w-64 p-4 z-40 transform transition-transform duration-300 ease-in-out ${isRtl ? 'right-0' : 'left-0'} hidden md:block md:translate-x-0`}>
        <div className="flex items-center justify-center h-16 mb-10 px-2">
            <ChezHugoLogo />
        </div>
        <nav className="flex flex-col space-y-2">
            {desktopNavLinks.map(link => <NavItem key={link.to} {...link} isMobile={false} />)}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-t-md flex items-center justify-around z-40 md:hidden">
        {mobileNavLinks.map(link => <NavItem key={link.to} {...link} isMobile={true} />)}
      </nav>
    </>
  );
};

export default Sidebar;