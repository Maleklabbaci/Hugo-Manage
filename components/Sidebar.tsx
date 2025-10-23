import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DashboardIcon, ProductsIcon, SettingsIcon, HistoryIcon, ShoppingCartIcon, StatsIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

// Reusable NavItem for both sidebar and bottom nav
const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string; isMobile?: boolean }> = ({ to, icon: Icon, label, isMobile }) => {
    const location = useLocation();
    // For bottom nav, we want to match the base path
    const isActive = location.pathname.startsWith(to);

    if (isMobile) {
        return (
            <NavLink
                to={to}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors duration-200 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'
                }`}
            >
                <Icon className="w-6 h-6 mb-1" />
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
            <span className="text-md">{label}</span>
        </NavLink>
    );
};


const Sidebar: React.FC = () => {
  const { t, language } = useAppContext();
  const isRtl = language === 'ar';
  
  const mobileNavLinks = [
    { to: "/dashboard", icon: DashboardIcon, label: t('sidebar.dashboard') },
    { to: "/products", icon: ProductsIcon, label: t('sidebar.products') },
    { to: "/sales", icon: ShoppingCartIcon, label: t('sidebar.sales') },
    { to: "/history", icon: HistoryIcon, label: t('sidebar.history') },
    { to: "/settings", icon: SettingsIcon, label: t('sidebar.settings') },
  ];

  const desktopNavLinks = [
    { to: "/dashboard", icon: DashboardIcon, label: t('sidebar.dashboard') },
    { to: "/products", icon: ProductsIcon, label: t('sidebar.products') },
    { to: "/sales", icon: ShoppingCartIcon, label: t('sidebar.sales') },
    { to: "/statistics", icon: StatsIcon, label: t('sidebar.statistics') },
    { to: "/history", icon: HistoryIcon, label: t('sidebar.history') },
    { to: "/settings", icon: SettingsIcon, label: t('sidebar.settings') },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 h-full bg-black/30 backdrop-blur-xl border-r border-white/10 text-white w-64 p-4 z-40 transform transition-transform duration-300 ease-in-out ${isRtl ? 'right-0' : 'left-0'} hidden md:block md:translate-x-0`}>
        <div className="flex items-center mb-10 px-2">
            <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold ms-3">Chez Hugo</h1>
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