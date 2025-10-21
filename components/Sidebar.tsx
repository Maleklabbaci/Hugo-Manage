import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, ProductsIcon, StatsIcon, SettingsIcon, HistoryIcon, ShoppingCartIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string; onClick?: () => void }> = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center px-4 py-3 text-slate-300 hover:bg-secondary hover:text-white rounded-lg transition-all duration-200 ${
            isActive ? 'bg-accent text-dark font-bold' : ''
            }`
        }
    >
        <Icon className="w-6 h-6 me-4" />
        <span className="text-md">{label}</span>
    </NavLink>
);

const Sidebar: React.FC<{ isOpen: boolean; toggle: () => void }> = ({ isOpen, toggle }) => {
  const { t, language } = useAppContext();
  const isRtl = language === 'ar';
  
  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={toggle}></div>
      <aside className={`fixed top-0 h-full bg-dark text-white w-64 p-4 z-40 transform transition-transform duration-300 ease-in-out ${isRtl ? 'right-0' : 'left-0'} ${isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} md:translate-x-0`}>
        <div className="flex items-center mb-10 px-2">
            <svg className="w-10 h-10 text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold ms-3">Chez Hugo</h1>
        </div>
        <nav className="flex flex-col space-y-2">
            <NavItem to="/dashboard" icon={DashboardIcon} label={t('sidebar.dashboard')} onClick={window.innerWidth < 768 ? toggle : undefined} />
            <NavItem to="/products" icon={ProductsIcon} label={t('sidebar.products')} onClick={window.innerWidth < 768 ? toggle : undefined} />
            <NavItem to="/sales" icon={ShoppingCartIcon} label={t('sidebar.sales')} onClick={window.innerWidth < 768 ? toggle : undefined} />
            <NavItem to="/statistics" icon={StatsIcon} label={t('sidebar.statistics')} onClick={window.innerWidth < 768 ? toggle : undefined} />
            <NavItem to="/history" icon={HistoryIcon} label={t('sidebar.history')} onClick={window.innerWidth < 768 ? toggle : undefined} />
            <NavItem to="/settings" icon={SettingsIcon} label={t('sidebar.settings')} onClick={window.innerWidth < 768 ? toggle : undefined} />
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;