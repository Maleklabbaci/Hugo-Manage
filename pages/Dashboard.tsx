import React, { useMemo, useState } from 'react';
import StatCard from '../components/StatCard';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Product, Language } from '../types';
import { ShoppingBagIcon, DollarSignIcon, TrendingUpIcon, PackageXIcon, ShoppingCartIcon, ArchiveIcon, CreditCardIcon, PiggyBankIcon, AlertCircleIcon, XIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#22D3EE', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const Dashboard: React.FC = () => {
  const { products, sales, t, language } = useAppContext();
  const [dismissedNotifications, setDismissedNotifications] = useState<number[]>([]);
  const locale = localeMap[language];

  const notifications = useMemo(() => {
    const lowStockAlerts = products
      .filter(p => p.stock > 0 && p.stock <= 5 && !dismissedNotifications.includes(p.id))
      .map(p => ({
        id: p.id,
        type: 'warning',
        message: t('dashboard.notifications.low_stock', { productName: p.name, count: p.stock }),
      }));

    const outOfStockAlerts = products
      .filter(p => p.stock === 0 && !dismissedNotifications.includes(p.id))
      .map(p => ({
        id: p.id,
        type: 'error',
        message: t('dashboard.notifications.out_of_stock', { productName: p.name }),
      }));

    return [...outOfStockAlerts, ...lowStockAlerts];
  }, [products, dismissedNotifications, t]);

  const handleDismissNotification = (productId: number) => {
    setDismissedNotifications(prev => [...prev, productId]);
  };

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const stockValue = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
    const potentialRevenue = products.reduce((acc, p) => acc + p.sellPrice * p.stock, 0);
    const totalProfit = potentialRevenue - stockValue;
    const outOfStock = products.filter(p => p.stock === 0).length;
    
    const salesRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    const unitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
    const salesProfit = sales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);
    
    // Weekly Sales Growth Calculation
    const today = new Date();
    const startOfThisWeek = getWeekStart(today);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekRevenue = sales
      .filter(s => new Date(s.createdAt) >= startOfThisWeek)
      .reduce((acc, s) => acc + s.totalPrice, 0);

    const lastWeekRevenue = sales
      .filter(s => {
        const saleDate = new Date(s.createdAt);
        return saleDate >= startOfLastWeek && saleDate < startOfThisWeek;
      })
      .reduce((acc, s) => acc + s.totalPrice, 0);
      
    let weeklySalesGrowth: number;
    if (lastWeekRevenue > 0) {
        weeklySalesGrowth = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    } else if (thisWeekRevenue > 0) {
        weeklySalesGrowth = Infinity;
    } else {
        weeklySalesGrowth = 0;
    }


    return { totalProducts, stockValue, totalProfit, outOfStock, salesRevenue, unitsSold, salesProfit, weeklySalesGrowth };
  }, [products, sales]);

  const formatGrowth = (growth: number): string => {
    if (growth === Infinity) {
      return '🔺 +∞%';
    }
    const sign = growth >= 0 ? '+' : '';
    const arrow = growth >= 0 ? '🔺' : '🔻';
    return `${arrow} ${sign}${growth.toFixed(0)} %`;
  };

  const weeklyProfitData = useMemo(() => {
    const profitByWeek: { [key: string]: number } = {};
    
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const recentSales = sales.filter(sale => new Date(sale.createdAt) >= eightWeeksAgo);

    recentSales.forEach(sale => {
      const weekStartDate = getWeekStart(new Date(sale.createdAt));
      const weekKey = weekStartDate.toISOString().split('T')[0];
      
      if (!profitByWeek[weekKey]) {
        profitByWeek[weekKey] = 0;
      }
      profitByWeek[weekKey] += sale.totalMargin;
    });

    return Object.entries(profitByWeek)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, profit]) => ({
        name: new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        profit: parseFloat(profit.toFixed(2)),
      }));
  }, [sales, locale]);

  const stockByCategoryData = useMemo(() => {
    const categoryMap = products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.stock;
      return acc;
    }, {});
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [products]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/80 p-2 border border-white/10 rounded-md shadow-lg">
          <p className="label text-white">{`${label}`}</p>
          <p className="text-cyan-400">{`${t('dashboard.chart.profit')}: ${payload[0].value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="space-y-8 text-slate-800 dark:text-white">
        {notifications.length > 0 && (
            <div className="space-y-3">
                 <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('dashboard.notifications.title')}</h3>
                 <AnimatePresence>
                    {notifications.map(notification => (
                         <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
                            className={`flex items-center justify-between p-4 rounded-lg backdrop-blur-md ${
                                notification.type === 'error'
                                ? 'bg-red-500/20 text-red-100 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-100 border border-amber-500/30'
                            }`}
                         >
                             <div className="flex items-center">
                                {notification.type === 'error' ? (
                                    <PackageXIcon className="w-5 h-5 me-3 flex-shrink-0" />
                                ) : (
                                    <AlertCircleIcon className="w-5 h-5 me-3 flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">{notification.message}</span>
                             </div>
                             <button 
                                onClick={() => handleDismissNotification(notification.id)} 
                                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ms-4"
                                aria-label="Dismiss notification"
                            >
                                 <XIcon className="w-4 h-4" />
                             </button>
                         </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={CreditCardIcon} title={t('dashboard.sales_revenue')} value={`${stats.salesRevenue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={PiggyBankIcon} title={t('dashboard.sales_profit')} value={`${stats.salesProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ShoppingCartIcon} title={t('dashboard.units_sold')} value={stats.unitsSold} />
        <StatCard icon={TrendingUpIcon} title={t('dashboard.weekly_sales_growth')} value={formatGrowth(stats.weeklySalesGrowth)} description={t('dashboard.this_week')} />
        <StatCard icon={TrendingUpIcon} title={t('dashboard.potential_profit')} value={`${stats.totalProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ArchiveIcon} title={t('dashboard.stock_value')} value={`${stats.stockValue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ShoppingBagIcon} title={t('dashboard.total_products')} value={stats.totalProducts} />
        <StatCard icon={PackageXIcon} title={t('dashboard.out_of_stock')} value={stats.outOfStock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.weekly_profit_chart_title')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProfitData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} fontSize={12} />
              <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={(value) => `${value.toLocaleString(locale)} DA`} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34,211,238,0.1)'}}/>
              <Legend />
              <Line type="monotone" dataKey="profit" name={t('dashboard.chart.profit')} stroke="#22D3EE" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.stock_by_category_chart_title')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8">
                {stockByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} ${t('dashboard.chart.units')}`} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)'}}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;