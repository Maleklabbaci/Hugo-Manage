import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Language } from '../types';
import StatCard from '../components/StatCard';
import { DollarSignIcon, PiggyBankIcon, ShoppingCartIcon, ArchiveIcon, TrendingUpIcon, LoaderIcon } from '../components/Icons';
import { motion } from 'framer-motion';

const COLORS = ['#22D3EE', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#ffc0cb'];
const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-GB',
    ar: 'ar-SA-u-nu-latn',
};

type TimeRange = '7d' | '30d' | '1y' | 'all';

const Statistics: React.FC = () => {
    const { products, sales, t, language, theme, isLoading } = useAppContext();
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const locale = localeMap[language];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <LoaderIcon className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    const filteredSales = useMemo(() => {
        const now = new Date();
        
        const validSales = sales.filter(s => {
            if (!s.createdAt) return false;
            const d = new Date(s.createdAt);
            return d instanceof Date && !isNaN(d.getTime());
        });

        if (timeRange === 'all') {
            return validSales;
        }

        let startDate = new Date();
        switch (timeRange) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        startDate.setHours(0,0,0,0);
        
        return validSales.filter(s => new Date(s.createdAt) >= startDate);

    }, [sales, timeRange]);

    const stats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalPrice, 0);
        const totalProfit = filteredSales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);
        const unitsSold = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
        const totalOrders = filteredSales.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return { totalRevenue, totalProfit, unitsSold, totalOrders, avgOrderValue };
    }, [filteredSales]);
    
    const revenueOverTimeData = useMemo(() => {
        if (filteredSales.length === 0) return [];
        const isLongRange = timeRange === '1y' || timeRange === 'all';

        const groupedData = filteredSales.reduce<Record<string, number>>((acc, sale) => {
            const date = new Date(sale.createdAt);
            if (isNaN(date.getTime())) return acc;

            const key = isLongRange
                ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}` // YYYY-MM
                : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; // YYYY-MM-DD

            acc[key] = (acc[key] || 0) + sale.totalPrice;
            return acc;
        }, {});

        return Object.entries(groupedData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, revenue]) => {
                const isLongRangeFormat = key.length === 7; // YYYY-MM
                const date = new Date(isLongRangeFormat ? `${key}-01T12:00:00Z` : `${key}T12:00:00Z`);

                const name = isLongRange
                    ? date.toLocaleString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
                    : date.toLocaleString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
                return { name, revenue };
            });

    }, [filteredSales, timeRange, locale]);
    
    const topSellingProductsData = useMemo(() => {
        const productSales = filteredSales.reduce<Record<string, { name: string, revenue: number }>>((acc, sale) => {
            if (sale.productName) {
                if (!acc[sale.productName]) {
                    acc[sale.productName] = { name: sale.productName, revenue: 0 };
                }
                acc[sale.productName].revenue += sale.totalPrice || 0;
            }
            return acc;
        }, {});

        return Object.values(productSales)
            .sort((a: { revenue: number }, b: { revenue: number }) => (b.revenue || 0) - (a.revenue || 0))
            .slice(0, 5);
    }, [filteredSales]);

    const stockByCategoryData = useMemo(() => {
        const stockByCategory = products.reduce<Record<string, number>>((acc, p) => {
            if (!p.category) return acc;
            const simplifiedCategory = p.category.split(/\s*>\s*/).pop()?.trim() || p.category;
            acc[simplifiedCategory] = (acc[simplifiedCategory] || 0) + (p.stock || 0);
            return acc;
        }, {});
        return Object.entries(stockByCategory).map(([name, value]) => ({ name, value }));
    }, [products]);
    
    const CustomTooltip = ({ active, payload, label, formatter }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 border border-gray-200 dark:border-white/10 rounded-md shadow-lg">
                    <p className="label text-gray-700 dark:text-white">{label}</p>
                    <p className="text-cyan-400">{`${payload[0].name}: ${formatter(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };
    
    const TimeRangeButton: React.FC<{ range: TimeRange, label: string }> = ({ range, label }) => (
        <motion.button
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors relative ${
                timeRange === range ? 'text-white' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
            whileTap={{ scale: 0.95 }}
        >
            {label}
            {timeRange === range && (
                <motion.div
                    layoutId="active-range-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
        </motion.button>
    );

    return (
        <div className="space-y-8 text-gray-900 dark:text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sidebar.statistics')}</h2>
                <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-black/20 rounded-xl">
                    <TimeRangeButton range="7d" label={t('statistics.range.7d')} />
                    <TimeRangeButton range="30d" label={t('statistics.range.30d')} />
                    <TimeRangeButton range="1y" label={t('statistics.range.1y')} />
                    <TimeRangeButton range="all" label={t('statistics.range.all')} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard icon={DollarSignIcon} title={t('dashboard.sales_revenue')} value={stats.totalRevenue.toLocaleString(locale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} />
                <StatCard icon={PiggyBankIcon} title={t('dashboard.sales_profit')} value={stats.totalProfit.toLocaleString(locale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} />
                <StatCard icon={ShoppingCartIcon} title={t('dashboard.units_sold')} value={stats.unitsSold.toLocaleString(locale)} />
                <StatCard icon={ArchiveIcon} title={t('statistics.total_orders')} value={stats.totalOrders.toLocaleString(locale)} />
                <StatCard icon={TrendingUpIcon} title={t('statistics.avg_order_value')} value={stats.avgOrderValue.toLocaleString(locale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4">{t('statistics.revenue_over_time')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueOverTimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.1)"} />
                            <XAxis dataKey="name" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} fontSize={12} />
                            <YAxis tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} tickFormatter={(value: number) => `${value.toLocaleString(locale)}`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(34,211,238,0.1)' }}
                                content={<CustomTooltip formatter={(value: number) => value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })} />}
                            />
                            <Bar dataKey="revenue" name={t('statistics.chart.revenue')} fill="#22D3EE" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4">{t('statistics.top_selling_products')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={topSellingProductsData} layout="vertical" margin={{ left: 30, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.1)"} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} fontSize={12} width={100} tickFormatter={value => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
                            <Tooltip
                                cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }}
                                content={<CustomTooltip formatter={(value: number) => value.toLocaleString(locale, { style: 'currency', currency: 'DZD' })} />}
                            />
                            <Bar dataKey="revenue" name={t('statistics.chart.revenue')} fill="#8884d8" barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.stock_by_category_chart_title')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={stockByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                            {stockByCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString(locale)} ${t('dashboard.chart.units')}`} contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`}}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default Statistics;