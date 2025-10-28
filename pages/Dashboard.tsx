import React, { useMemo, useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import type { Language, Sale } from '../types';
import { ShoppingBagIcon, DollarSignIcon, PackageXIcon, ShoppingCartIcon, ArchiveIcon, CreditCardIcon, PiggyBankIcon, DeliveryIcon, DatabaseIcon, TrendingUpIcon, ServerIcon } from '../components/Icons';
import AIInsights from '../components/AIInsights';
import { motion } from 'framer-motion';

const COLORS = ['#06b6d4', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#ffc0cb'];

const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

type TimeRange = '7d' | '30d' | '1y' | 'all';

const Dashboard: React.FC = () => {
  const { products, sales, t, language, theme } = useAppContext();
  const locale = localeMap[language];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const validSales = sales.filter(s => s.createdAt && !isNaN(new Date(s.createdAt).getTime()));

    if (timeRange === 'all') return validSales;

    let startDate = new Date();
    switch (timeRange) {
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
    }
    startDate.setHours(0,0,0,0);
    return validSales.filter(s => new Date(s.createdAt) >= startDate);
  }, [sales, timeRange]);

  const stats = useMemo(() => {
    // Global stats (not time-filtered)
    const totalProducts = products.length;
    const stockValue = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
    const potentialRevenue = products.reduce((acc, p) => acc + p.sellPrice * p.stock, 0);
    const potentialStockProfit = potentialRevenue - stockValue;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const unitsInDelivery = products.filter(p => p.status === 'en livraison').length;
    const totalCurrentStockAndDelivery = products.reduce((acc, p) => acc + p.stock, 0);
    const totalUnitsSoldEver = sales.reduce((acc, s) => acc + s.quantity, 0);
    const totalUnits = totalCurrentStockAndDelivery + totalUnitsSoldEver;

    // Time-filtered sales stats
    const salesRevenue = filteredSales.reduce((acc, s) => acc + s.totalPrice, 0);
    const unitsSold = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
    const salesProfit = filteredSales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);
    const totalOrders = filteredSales.length;
    const avgOrderValue = totalOrders > 0 ? salesRevenue / totalOrders : 0;

    return { totalProducts, stockValue, potentialStockProfit, outOfStock, unitsInDelivery, salesRevenue, unitsSold, salesProfit, totalOrders, avgOrderValue, totalUnits };
  }, [products, sales, filteredSales]);

  const profitOverTimeData = useMemo(() => {
    if (filteredSales.length === 0) return [];
    const isLongRange = timeRange === '1y' || timeRange === 'all';

    const groupedData = filteredSales.reduce<Record<string, number>>((acc, sale) => {
        const date = new Date(sale.createdAt);
        const key = isLongRange
            ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}` // YYYY-MM
            : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; // YYYY-MM-DD
        acc[key] = (acc[key] || 0) + (sale.totalMargin || 0);
        return acc;
    }, {});

    return Object.entries(groupedData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, profit]) => {
          const isLongRangeFormat = key.length === 7;
          const date = new Date(isLongRangeFormat ? `${key}-01T12:00:00Z` : `${key}T12:00:00Z`);
          const name = isLongRange
              ? date.toLocaleString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
              : date.toLocaleString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
          // FIX: Cast `profit` to `number` to resolve TypeScript inference issue.
          return { name, profit: parseFloat((profit as number).toFixed(2)) };
      });
  }, [filteredSales, timeRange, locale]);

  const stockByCategoryData = useMemo(() => {
    const categoryMap = products.reduce<Record<string, number>>((acc, p) => {
      const simplifiedCategory = p.category.split(' > ').pop()?.trim() || p.category;
      acc[simplifiedCategory] = (acc[simplifiedCategory] || 0) + p.stock;
      return acc;
    }, {});
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [products]);

  const topSellingProductsData = useMemo(() => {
    const productSales = filteredSales.reduce<Record<string, { name: string, revenue: number }>>((acc, sale) => {
        if (sale.productName) {
            if (!acc[sale.productName]) acc[sale.productName] = { name: sale.productName, revenue: 0 };
            acc[sale.productName].revenue += sale.totalPrice || 0;
        }
        return acc;
    }, {});
    // FIX: Add explicit types for sort arguments to resolve TypeScript inference issue.
    return Object.values(productSales).sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredSales]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg">
          <p className="label text-slate-700 dark:text-white">{`${label}`}</p>
          <p className="text-brand">{`${payload[0].name}: ${payload[0].value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`}</p>
        </div>
      );
    }
    return null;
  };

  const TimeRangeButton: React.FC<{ range: TimeRange, label: string }> = ({ range, label }) => (
    <motion.button
        onClick={() => setTimeRange(range)}
        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors relative ${
            timeRange === range ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
        }`}
        whileTap={{ scale: 0.95 }}
    >
        {label}
        {timeRange === range && (
            <motion.div layoutId="active-range-indicator" className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg -z-10" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        )}
    </motion.button>
  );

  return (
    <div className="space-y-8 text-slate-900 dark:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('sidebar.dashboard')}</h2>
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <TimeRangeButton range="7d" label={t('dashboard.range.7d')} />
            <TimeRangeButton range="30d" label={t('dashboard.range.30d')} />
            <TimeRangeButton range="1y" label={t('dashboard.range.1y')} />
            <TimeRangeButton range="all" label={t('dashboard.range.all')} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        <StatCard icon={CreditCardIcon} title={t('dashboard.sales_revenue')} value={`${stats.salesRevenue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={PiggyBankIcon} title={t('dashboard.sales_profit')} value={`${stats.salesProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ShoppingCartIcon} title={t('dashboard.units_sold')} value={stats.unitsSold} />
        <StatCard icon={ArchiveIcon} title={t('dashboard.total_orders')} value={stats.totalOrders} />
        <StatCard icon={TrendingUpIcon} title={t('dashboard.potential_stock_profit')} value={`${stats.potentialStockProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={DatabaseIcon} title={t('dashboard.stock_value')} value={`${stats.stockValue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ShoppingBagIcon} title={t('dashboard.total_products')} value={stats.totalProducts} />
        <StatCard icon={PackageXIcon} title={t('dashboard.out_of_stock')} value={stats.outOfStock} />
        <StatCard icon={DeliveryIcon} title={t('dashboard.units_in_delivery')} value={stats.unitsInDelivery} />
        <StatCard icon={ServerIcon} title={t('dashboard.total_units')} value={stats.totalUnits} />
      </div>

      <AIInsights />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.weekly_profit_chart_title')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitOverTimeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.1)"} />
              <XAxis dataKey="name" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} fontSize={12} />
              <YAxis tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} tickFormatter={(value) => `${value.toLocaleString(locale)}`} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34,211,238,0.1)'}}/>
              <Legend />
              <Line type="monotone" dataKey="profit" name={t('dashboard.chart.profit')} stroke="#06b6d4" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.top_selling_products')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSellingProductsData} layout="vertical" margin={{ left: 30, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.1)"} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} fontSize={12} width={100} tickFormatter={value => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
                    <Tooltip cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }} content={<CustomTooltip formatter={(value: number) => value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })} />} />
                    <Bar dataKey="revenue" name={t('dashboard.chart.revenue')} fill="#8884d8" barSize={15} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.stock_by_category_chart_title')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockByCategoryData} dataKey="value" nameKey="name" cx={isMobile ? '50%' : '40%'} cy="50%" outerRadius={isMobile ? 80 : 100} fill="#8884d8">
                {stockByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} ${t('dashboard.chart.units')}`} contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme === 'dark' ? '#cbd5e1' : '#e2e8f0'}`}}/>
              <Legend 
                layout={isMobile ? 'horizontal' : 'vertical'} 
                verticalAlign={isMobile ? 'bottom' : 'middle'} 
                align={isMobile ? 'center' : 'right'} 
                wrapperStyle={isMobile ? { paddingTop: '20px' } : { maxHeight: 250, overflowY: 'auto', paddingLeft: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
};

export default Dashboard;