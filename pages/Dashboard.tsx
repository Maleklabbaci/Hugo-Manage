import React, { useMemo } from 'react';
import StatCard from '../components/StatCard';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import type { Product } from '../types';
import { ShoppingBagIcon, DollarSignIcon, TrendingUpIcon, PackageXIcon } from '../components/Icons';

const COLORS = ['#22D3EE', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

const calculateMargin = (product: Product) => {
  if (product.sellPrice === 0) return 0;
  return ((product.sellPrice - product.buyPrice) / product.sellPrice) * 100;
};

const Dashboard: React.FC = () => {
  const { products } = useAppContext();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const stockValue = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
    const potentialRevenue = products.reduce((acc, p) => acc + p.sellPrice * p.stock, 0);
    const totalProfit = potentialRevenue - stockValue;
    const outOfStock = products.filter(p => p.stock === 0).length;
    return { totalProducts, stockValue, totalProfit, outOfStock };
  }, [products]);

  const marginData = useMemo(() => {
    return products
      .map(p => ({
        name: p.name,
        marge: parseFloat(calculateMargin(p).toFixed(2)),
      }))
      .sort((a, b) => b.marge - a.marge)
      .slice(0, 10);
  }, [products]);

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
          <p className="label text-white">{`${label} : ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="space-y-8 text-slate-800 dark:text-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={ShoppingBagIcon} title="Total produits" value={stats.totalProducts} />
        <StatCard icon={DollarSignIcon} title="Valeur du stock" value={`${stats.stockValue.toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={TrendingUpIcon} title="Bénéfice potentiel" value={`${stats.totalProfit.toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}`} />
        <StatCard icon={PackageXIcon} title="Produits en rupture" value={stats.outOfStock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Marge par produit (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marginData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} fontSize={12} interval={0} angle={-30} textAnchor="end" height={80}/>
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34,211,238,0.1)'}}/>
              <Bar dataKey="marge" fill="#22D3EE" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Stock par catégorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8">
                {stockByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} unités`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;