import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataViewerModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  columns: Column<T>[];
}

const ITEMS_PER_PAGE = 10;

const DataViewerModal = <T extends { id: number | string }>({ isOpen, onClose, title, data, columns }: DataViewerModalProps<T>) => {
  const { t } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen, data]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const backdropVariants: Variants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants: Variants = {
    hidden: { y: "-50px", opacity: 0, scale: 0.9 },
    visible: { y: "0", opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 150 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-secondary rounded-2xl shadow-xl w-full max-w-4xl relative max-h-[90vh] flex flex-col"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <XIcon />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 sticky top-0">
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} scope="col" className="px-6 py-3">{col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedData.map(item => (
                                <tr key={item.id} className="bg-white dark:bg-secondary hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    {columns.map((col, index) => (
                                        <td key={index} className="px-6 py-4 whitespace-nowrap">{col.accessor(item)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.length === 0 && (
                    <p className="text-center py-10 text-slate-500 dark:text-slate-400">{t('settings.modal.no_data')}</p>
                )}
            </div>
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-secondary">
                        <ChevronLeftIcon className="w-5 h-5 text-slate-500 dark:text-slate-300"/>
                    </button>
                    <span className="mx-4 text-slate-700 dark:text-slate-200">{t('products.pagination', { currentPage, totalPages })}</span>
                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-secondary">
                        <ChevronRightIcon className="w-5 h-5 text-slate-500 dark:text-slate-300"/>
                    </button>
                </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DataViewerModal;
