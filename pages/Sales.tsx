import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ShoppingCartIcon, DeleteIcon } from '../components/Icons';

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

const Sales: React.FC = () => {
    const { sales, deleteSale } = useAppContext();

    const handleDeleteSale = (saleId: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir annuler cette vente ? Le stock du produit sera restauré.")) {
            deleteSale(saleId);
        }
    };

    if (sales.length === 0) {
        return (
            <div className="text-center py-10">
                <ShoppingCartIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Aucune vente enregistrée</h2>
                <p className="text-slate-500 dark:text-slate-400">Commencez à vendre des produits depuis la page "Produits".</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Historique des Ventes</h2>
            <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                            <tr>
                                {["Produit", "Quantité", "Prix Unitaire", "Prix Total", "Marge", "Date", "Actions"].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale.id} className="bg-white dark:bg-secondary border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{sale.productName}</td>
                                    <td className="px-6 py-4">{sale.quantity}</td>
                                    <td className="px-6 py-4">{sale.sellPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}</td>
                                    <td className="px-6 py-4 font-semibold">{sale.totalPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}</td>
                                    <td className="px-6 py-4 text-green-500 font-semibold">
                                        {(sale.totalMargin ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                                    </td>
                                    <td className="px-6 py-4">{formatTimestamp(sale.timestamp)}</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleDeleteSale(sale.id)} 
                                            className="p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                                            title="Supprimer la vente">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales;