import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { XIcon, AlertCircleIcon, LoaderIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    const { t } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error("Confirmation action failed:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsLoading(false);
            onClose();
        }
    };
    
    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 }};
    const modalVariants: Variants = {
        hidden: { y: "-50px", opacity: 0, scale: 0.95 },
        visible: { y: "0", opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 150 } },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
                    onClick={() => !isLoading && onClose()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirmation-title"
                >
                    <motion.div 
                        className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md relative p-8"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center sm:text-left sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-500/20 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertCircleIcon className="h-6 w-6 text-cyan-500" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ms-4">
                                <h2 id="confirmation-title" className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                                <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{message}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                            <motion.button type="button" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{cancelText || t('cancel')}</motion.button>
                            <motion.button onClick={handleConfirm} disabled={isLoading} className="w-full sm:w-auto text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-wait" whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                                {isLoading && <LoaderIcon className="animate-spin w-5 h-5 me-2"/>}
                                {confirmText || t('confirm')}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;