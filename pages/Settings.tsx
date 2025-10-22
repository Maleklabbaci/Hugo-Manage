import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon, DatabaseIcon, UploadIcon, DownloadIcon, RefreshCwIcon, AddIcon, EditIcon, DeleteIcon, ShoppingCartIcon, UndoIcon } from '../components/Icons';
import type { Language, Theme, Product, Sale, ActivityLog } from '../types';
import DataViewerModal, { Column } from '../components/DataViewerModal';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t, products, sales, activityLog, importData, exportData, resetData } = useAppContext();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [modalContent, setModalContent] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    columns: Column<any>[];
  }>({ isOpen: false, title: '', data: [], columns: [] });

  const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn';

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  };
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }

  const handleExport = async () => {
    setIsLoading(true);
    const jsonData = await exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `chez-hugo-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsLoading(false);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (window.confirm(t('settings.confirm_import_text'))) {
              setIsLoading(true);
              const reader = new FileReader();
              reader.onload = async (event) => {
                  try {
                      const content = event.target?.result as string;
                      await importData(content);
                      alert(t('settings.import_success'));
                  } catch (err) {
                      console.error(err);
                      alert(t('settings.import_error_format'));
                  } finally {
                      setIsLoading(false);
                  }
              };
              reader.onerror = () => {
                  alert(t('settings.import_error_read'));
                  setIsLoading(false);
              }
              reader.readAsText(file);
          }
      }
      if(e.target) e.target.value = '';
  };

  const handleReset = async () => {
      if (window.confirm(t('settings.confirm_reset_text'))) {
          setIsLoading(true);
          await resetData();
          setIsLoading(false);
      }
  };

  const showProducts = () => {
    setModalContent({
        isOpen: true,
        title: t('sidebar.products'),
        data: products,
        columns: [
            { header: t('products.table.name'), accessor: (p: Product) => p.name },
            { header: t('products.table.category'), accessor: (p: Product) => p.category },
            { header: t('products.table.stock'), accessor: (p: Product) => p.stock },
            { header: t('products.table.sell_price'), accessor: (p: Product) => p.sellPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' }) },
        ]
    });
  };

  const showSales = () => {
    setModalContent({
        isOpen: true,
        title: t('sidebar.sales'),
        data: sales,
        columns: [
            { header: t('sales.table.product'), accessor: (s: Sale) => s.product_name },
            { header: t('sales.table.quantity'), accessor: (s: Sale) => s.quantity },
            { header: t('sales.table.total_price'), accessor: (s: Sale) => s.totalPrice.toLocaleString(locale, { style: 'currency', currency: 'DZD' }) },
            { header: t('sales.table.date'), accessor: (s: Sale) => formatTimestamp(s.timestamp) },
        ]
    });
  };

  const getActionIcon = (action: ActivityLog['action']) => {
    const iconMap = {
        created: AddIcon,
        updated: EditIcon,
        deleted: DeleteIcon,
        sold: ShoppingCartIcon,
        sale_cancelled: UndoIcon,
    };
    const Icon = iconMap[action] || EditIcon;
    return <Icon className="w-5 h-5 text-slate-500" />;
  }

  const showActivities = () => {
      setModalContent({
          isOpen: true,
          title: t('sidebar.history'),
          data: activityLog,
          columns: [
              { header: t('actions'), accessor: (log: ActivityLog) => getActionIcon(log.action) },
              { header: t('history.title'), accessor: (log: ActivityLog) => t(`history.action.${log.action}`, { productName: log.product_name }) },
              { header: t('history.details'), accessor: (log: ActivityLog) => log.details || '-' },
              { header: t('sales.table.date'), accessor: (log: ActivityLog) => formatTimestamp(log.timestamp) },
          ]
      });
  };
  
  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8 text-slate-800 dark:text-white">
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.theme_title')}</h3>
          <div className="flex items-center space-x-4">
            <p>{t('settings.theme_select')}</p>
            <div className="flex rounded-lg p-1 bg-slate-200 dark:bg-dark">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded-md ${theme === 'light' ? 'bg-accent text-dark' : 'text-slate-500 dark:text-slate-300'}`}
              >
                <SunIcon className="w-5 h-5"/>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-2 rounded-md ${theme === 'dark' ? 'bg-accent text-dark' : 'text-slate-500 dark:text-slate-300'}`}
              >
                <MoonIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center"><LanguagesIcon className="w-5 h-5 me-2"/> {t('settings.language_title')}</h3>
          <div className="flex items-center space-x-4">
              <p>{t('settings.language_select')}</p>
              <select value={language} onChange={handleLanguageChange} className="bg-slate-100 dark:bg-dark border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
              </select>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700 flex items-center">
                <DatabaseIcon className="w-5 h-5 me-2"/> {t('settings.data_title')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('settings.data_description')}{' '}
                <button onClick={showProducts} className="font-semibold text-accent hover:underline">{t('settings.data_stat_products', { count: products.length })}</button>,{' '}
                <button onClick={showSales} className="font-semibold text-accent hover:underline">{t('settings.data_stat_sales', { count: sales.length })}</button>,{' '}
                <button onClick={showActivities} className="font-semibold text-accent hover:underline">{t('settings.data_stat_activities', { count: activityLog.length })}</button>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                    <DownloadIcon className="w-5 h-5 me-2"/>
                    {t('settings.data_export')}
                </button>
                <button
                    onClick={handleImportClick}
                    disabled={isLoading}
                    className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                    <UploadIcon className="w-5 h-5 me-2"/>
                    {t('settings.data_import')}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
                <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                    <RefreshCwIcon className="w-5 h-5 me-2"/>
                    {t('settings.data_reset')}
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-slate-700">{t('settings.session_title')}</h3>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors w-full flex items-center justify-center"
          >
            <LogoutIcon className="w-5 h-5 me-2"/>
            {t('settings.logout_button')}
          </button>
        </div>
      </div>
      <DataViewerModal
          isOpen={modalContent.isOpen}
          onClose={() => setModalContent(prev => ({ ...prev, isOpen: false }))}
          title={modalContent.title}
          data={modalContent.data}
          columns={modalContent.columns}
      />
    </>
  );
};

export default Settings;