import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DashboardIcon, ProductsIcon, SettingsIcon, HistoryIcon, ShoppingCartIcon, StatsIcon, ChezHugoLogo } from './Icons';
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
                    isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'
                }`}
            >
                <div className="relative">
                    <Icon className="w-6 h-6 mb-1" />
                    {typeof count !== 'undefined' && count > 0 && (
                        <span className="absolute -top-1 -right-2 bg-cyan-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
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
            className={({isActive: isDesktopActive}) => `flex items-center px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 group ${
                isDesktopActive ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30' : ''
            }`}
        >
            <Icon className="w-6 h-6 me-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1 text-md">{label}</span>
            {typeof count !== 'undefined' && count > 0 && (
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2 py-0.5 rounded-full">
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
    { to: "/products", icon: ProductsIcon, label: t('sidebar.products'), count: products.length },
    { to: "/sales", icon: ShoppingCartIcon, label: t('sidebar.sales'), count: sales.length },
    { to: "/statistics", icon: StatsIcon, label: t('sidebar.statistics'), desktopOnly: true },
    { to: "/history", icon: HistoryIcon, label: t('sidebar.history') },
    { to: "/settings", icon: SettingsIcon, label: t('sidebar.settings') },
  ];
  
  const mobileNavLinks = navLinks.filter(l => !l.desktopOnly);
  const desktopNavLinks = navLinks;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 h-full bg-black/30 backdrop-blur-xl border-r border-white/10 text-white w-64 p-4 z-40 transform transition-transform duration-300 ease-in-out ${isRtl ? 'right-0' : 'left-0'} hidden md:block md:translate-x-0`}>
        <div className="flex items-center justify-center h-16 mb-10 px-2">
            <ChezHugoLogo />
        </div>
        <nav className="flex flex-col space-y-2">
            {desktopNavLinks.map(link => <NavItem key={link.to} {...link} isMobile={false} />)}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/30 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] flex items-center justify-around z-40 md:hidden">
        {mobileNavLinks.map(link => <NavItem key={link.to} {...link} isMobile={true} />)}
      </nav>
    </>
  );
};

export default Sidebar;