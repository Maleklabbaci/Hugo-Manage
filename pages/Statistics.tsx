



import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product, Language } from '../types';
import StatCard from '../components/StatCard';
import { TrendingUpIcon, PackageXIcon } from '../components/Icons';


const calculateMargin = (product: Product) => {
  if (product.sellPrice === 0) return 0;
  return ((product.sellPrice - product.buyPrice) / product.sellPrice) * 100;
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};


const COLORS = ['#22D3EE', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#ffc0cb'];
const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

const Statistics: React.FC = () => {
  const { products, sales, t, language } = useAppContext();
  const locale = localeMap[language];

  const monthlyProfitData = useMemo(() => {
    const profitByMonth: { [key: string]: number } = {};
    products.forEach(p => {
      const date = new Date(p.createdAt); // Use createdAt as updatedAt is not available
      const month = date.toLocaleString(locale, { month: 'short', year: '2-digit' });
      const profit = (p.sellPrice - p.buyPrice) * p.stock;
      profitByMonth[month] = (profitByMonth[month] || 0) + profit;
    });
    
    return Object.entries(profitByMonth)
      .map(([name, profit]) => ({ name, profit }))
      .slice(-12);
  }, [products, locale]);

  const monthlySalesData = useMemo(() => {
    const salesByMonth: { [key: string]: number } = {};
    sales.forEach(s => {
      if (!s.createdAt || !s.totalPrice) return;
      const date = new Date(s.createdAt);
      const month = date.toLocaleString(locale, { month: 'short', year: '2-digit' });
      salesByMonth[month] = (salesByMonth[month] || 0) + s.totalPrice;
    });
    
    const last12Months: { [key: string]: number } = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toLocaleString(locale, { month: 'short', year: '2-digit' });
        last12Months[monthKey] = 0;
    }

    const mergedData = {...last12Months, ...salesByMonth };

    return Object.entries(mergedData)
      .map(([name, revenue]) => ({ name, revenue }));
  }, [sales, locale]);


  const stockByCategoryData = useMemo(() => {
    const stockByCategory = products.reduce<Record<string, number>>((acc, p) => {
      if (!p.category) return acc;
      const simplifiedCategory = p.category.split(/\s*>\s*/).pop()?.trim() || p.category;
      acc[simplifiedCategory] = (acc[simplifiedCategory] || 0) + (p.stock || 0);
      return acc;
    }, {});
    return Object.entries(stockByCategory).map(([name, value]) => ({ name, value }));
  }, [products]);

  const indicators = useMemo(() => {
    const totalMargin = products.reduce((acc, p) => acc + calculateMargin(p), 0);
    const avgMargin = products.length > 0 ? totalMargin / products.length : 0;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const ruptureRate = products.length > 0 ? (outOfStockCount / products.length) * 100 : 0;
    
    // Weekly Sales Growth Calculation
    const today = new Date();
    const startOfThisWeek = getWeekStart(today);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekRevenue = sales
      .filter(s => s.createdAt && new Date(s.createdAt) >= startOfThisWeek)
      .reduce((acc, s) => acc + (s.totalPrice || 0), 0);

    const lastWeekRevenue = sales
      .filter(s => {
        if (!s.createdAt) return false;
        const saleDate = new Date(s.createdAt);
        return saleDate >= startOfLastWeek && saleDate < startOfThisWeek;
      })
      .reduce((acc, s) => acc + (s.totalPrice || 0), 0);
      
    let weeklySalesGrowth: number;
    if (lastWeekRevenue > 0) {
        weeklySalesGrowth = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    } else if (thisWeekRevenue > 0) {
        weeklySalesGrowth = Infinity;
    } else {
        weeklySalesGrowth = 0;
    }
    
    return { avgMargin, ruptureRate, weeklySalesGrowth };
  }, [products, sales]);
  
  const formatGrowth = (growth: number): string => {
    if (growth === Infinity) {
      return '🔺 +∞%';
    }
    const sign = growth >= 0 ? '+' : '';
    const arrow = growth >= 0 ? '🔺' : '🔻';
    return `${arrow} ${sign}${growth.toFixed(0)} %`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/80 p-2 border border-white/10 rounded-md shadow-lg">
          <p className="label text-white">{`${label} : ${payload[0].value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 text-slate-800 dark:text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={TrendingUpIcon} title={t('statistics.avg_margin')} value={`${indicators.avgMargin.toFixed(1)}%`} />
            <StatCard icon={PackageXIcon} title={t('statistics.out_of_stock_rate')} value={`${indicators.ruptureRate.toFixed(1)}%`} />
            <StatCard icon={TrendingUpIcon} title={t('statistics.weekly_sales_growth')} value={formatGrowth(indicators.weeklySalesGrowth)} description={t('dashboard.this_week')} />
        </div>
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">{t('statistics.monthly_revenue_chart_title')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} fontSize={12} />
                    <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={(value) => `${(value/1000)}k`} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        formatter={(value: number) => [value.toLocaleString(locale, { style: 'currency', currency: 'DZD' }), t('statistics.chart.revenue')]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name={t('statistics.chart.revenue')} fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">{t('statistics.potential_profit_chart_title')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyProfitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8' }}/>
                    <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={(value) => `${(value/1000)}k DA`} />
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend />
                    <Line type="monotone" dataKey="profit" name={t('statistics.chart.potential_profit')} stroke="#22D3EE" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">{t('statistics.category_distribution_chart_title')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={stockByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                        {stockByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} ${t('dashboard.chart.units')}`} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)'}}/>
                    <Legend wrapperStyle={{ overflow: "hidden", textOverflow: "ellipsis", width: "100%"}}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default Statistics;