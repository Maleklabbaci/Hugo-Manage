
import React, { useMemo } from 'react';
import StatCard from '../components/StatCard';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Product, Language } from '../types';
import { ShoppingBagIcon, DollarSignIcon, TrendingUpIcon, PackageXIcon, ShoppingCartIcon, ArchiveIcon, CreditCardIcon, PiggyBankIcon } from '../components/Icons';

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
  const locale = localeMap[language];

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const stockValue = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
    const potentialRevenue = products.reduce((acc, p) => acc + p.sellPrice * p.stock, 0);
    const totalProfit = potentialRevenue - stockValue;
    const outOfStock = products.filter(p => p.stock === 0).length;
    
    const salesRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    const unitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
    const salesProfit = sales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);

    return { totalProducts, stockValue, totalProfit, outOfStock, salesRevenue, unitsSold, salesProfit };
  }, [products, sales]);


  const weeklyProfitData = useMemo(() => {
    const profitByWeek: { [key: string]: number } = {};
    
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const recentSales = sales.filter(sale => new Date(sale.timestamp) >= eightWeeksAgo);

    recentSales.forEach(sale => {
      const weekStartDate = getWeekStart(new Date(sale.timestamp));
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
        <div className="bg-secondary p-2 border border-slate-700 rounded-md shadow-lg">
          <p className="label text-white">{`${label}`}</p>
          <p className="text-accent">{`${t('dashboard.chart.profit')}: ${payload[0].value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="space-y-8 text-slate-800 dark:text-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard icon={CreditCardIcon} title={t('dashboard.sales_revenue')} value={`${stats.salesRevenue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={PiggyBankIcon} title={t('dashboard.sales_profit')} value={`${stats.salesProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ShoppingCartIcon} title={t('dashboard.units_sold')} value={stats.unitsSold} />
        <StatCard icon={TrendingUpIcon} title={t('dashboard.potential_profit')} value={`${stats.totalProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ArchiveIcon} title={t('dashboard.stock_value')} value={`${stats.stockValue.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={ShoppingBagIcon} title={t('dashboard.total_products')} value={stats.totalProducts} />
        <StatCard icon={PackageXIcon} title={t('dashboard.out_of_stock')} value={stats.outOfStock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
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

        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.stock_by_category_chart_title')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8">
                {stockByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} ${t('dashboard.chart.units')}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
