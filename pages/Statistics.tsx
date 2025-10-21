import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product } from '../types';
import StatCard from '../components/StatCard';
import { TrendingUpIcon, PackageXIcon } from '../components/Icons';


const calculateMargin = (product: Product) => {
  if (product.sellPrice === 0) return 0;
  return ((product.sellPrice - product.buyPrice) / product.sellPrice) * 100;
};

const COLORS = ['#22D3EE', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

const Statistics: React.FC = () => {
  const { products } = useAppContext();

  const monthlyProfitData = useMemo(() => {
    const profitByMonth: { [key: string]: number } = {};
    products.forEach(p => {
      const date = new Date(p.updatedAt);
      const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      const profit = (p.sellPrice - p.buyPrice) * p.stock;
      profitByMonth[month] = (profitByMonth[month] || 0) + profit;
    });
    
    // This part is for demonstration. A real app would need a proper date sorting logic.
    return Object.entries(profitByMonth)
      .map(([name, profit]) => ({ name, profit }))
      .slice(-6); // show last 6 months for clarity
  }, [products]);

  const categoryDistribution = useMemo(() => {
    const countByCategory = products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(countByCategory).map(([name, value]) => ({ name, value }));
  }, [products]);

  const indicators = useMemo(() => {
    const totalMargin = products.reduce((acc, p) => acc + calculateMargin(p), 0);
    const avgMargin = totalMargin / products.length || 0;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const ruptureRate = (outOfStockCount / products.length) * 100 || 0;
    return { avgMargin, ruptureRate };
  }, [products]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-secondary p-2 border border-slate-700 rounded-md shadow-lg">
          <p className="label text-white">{`${label} : ${payload[0].value.toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 text-slate-800 dark:text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard icon={TrendingUpIcon} title="Marge moyenne" value={`${indicators.avgMargin.toFixed(1)}%`} />
            <StatCard icon={PackageXIcon} title="Taux de rupture" value={`${indicators.ruptureRate.toFixed(1)}%`} />
        </div>
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Évolution du bénéfice potentiel par mois</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyProfitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8' }}/>
                    <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={(value) => `${(value/1000)}k DA`} />
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend />
                    <Line type="monotone" dataKey="profit" name="Bénéfice" stroke="#22D3EE" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Répartition des produits par catégorie</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} produits`}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default Statistics;