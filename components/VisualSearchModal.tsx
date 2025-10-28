import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generateProductTitleAndCategory, getBestVisualMatch } from '../services/gemini';
import { Product } from '../types';
import { XIcon, CameraIcon, LoaderIcon, ProductsIcon } from './Icons';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanState = 'initializing' | 'idle' | 'scanning' | 'analyzing' | 'results' | 'error' | 'no-camera';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject('Failed to convert blob to base64');
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose }) => {
    const { t, products } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [foundProducts, setFoundProducts] = useState<Product[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [analysisText, setAnalysisText] = useState('');

    const startCamera = useCallback(async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                // Do not set state to idle here. Wait for onCanPlay event on video element.
            } else {
                setScanState('no-camera');
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setScanState('no-camera');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setScanState('initializing');
            startCamera();
        } else {
            stopCamera();
            setFoundProducts([]);
            setScanState('idle'); // Reset state correctly on close
        }
        return stopCamera;
    }, [isOpen, startCamera, stopCamera]);
    
    const handleScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setScanState('scanning');

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    setScanState('analyzing');
                    
                    const uniqueCategories = [...new Set(products.map(p => p.category))];
                    
                    setAnalysisText(t('visual_search.classifying_object'));
                    const base64Data = await blobToBase64(blob);
                    const classification = await generateProductTitleAndCategory(base64Data, uniqueCategories);
                    
                    if (classification) {
                        const { title, category } = classification;
                        setAnalysisText(t('visual_search.searching_in_category', { category }));

                        const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                        const candidates = products
                            .filter(p => p.category.toLowerCase().includes(category.toLowerCase()))
                            .map(product => {
                                let score = 0;
                                const name = product.name.toLowerCase();
                                keywords.forEach(keyword => {
                                    if (name.includes(keyword)) score++;
                                });
                                return { ...product, score };
                            })
                            .filter(p => p.score > 0)
                            .sort((a, b) => b.score - a.score);

                        if (candidates.length > 0) {
                            setAnalysisText(t('visual_search.comparing_matches'));
                            const bestMatch = await getBestVisualMatch(base64Data, candidates);
                            
                            if (bestMatch) {
                                setFoundProducts([bestMatch]);
                            } else {
                                setFoundProducts(candidates.slice(0, 5));
                            }
                        } else {
                            setFoundProducts([]);
                        }
                    } else {
                        setFoundProducts([]);
                    }
                    setScanState('results');

                } catch (err) {
                    console.error("Analysis failed:", err);
                    setErrorMsg(t('visual_search.error.analysis'));
                    setScanState('error');
                }
            } else {
                setErrorMsg(t('visual_search.error.capture'));
                setScanState('error');
            }
        }, 'image/jpeg', 0.9);
    };

    const handleRetry = () => {
        setFoundProducts([]);
        setScanState('idle');
    }

    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
    const modalVariants: Variants = {
        hidden: { y: "50px", opacity: 0, scale: 0.95 },
        visible: { y: "0", opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } },
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants} onClick={onClose}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg relative flex flex-col overflow-hidden"
                        variants={modalVariants} onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{t('visual_search.title')}</h2>
                            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><XIcon /></button>
                        </header>
                        
                        <div className="aspect-video bg-black relative">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover" 
                                onCanPlay={() => { if (scanState === 'initializing') { setScanState('idle'); } }}
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <AnimatePresence>
                            {(scanState === 'initializing' || scanState === 'scanning' || scanState === 'analyzing') && (
                                <motion.div 
                                    className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                >
                                    <LoaderIcon className="w-10 h-10 animate-spin mb-4" />
                                    <p className="font-semibold">
                                        {scanState === 'initializing' ? t('visual_search.starting_camera') :
                                         scanState === 'scanning' ? t('visual_search.scanning') :
                                         analysisText}
                                    </p>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                        
                        {scanState === 'results' || scanState === 'error' ? (
                            <div className="p-4 flex-1 overflow-y-auto">
                                {foundProducts.length > 0 ? (
                                    <>
                                        <p className="font-semibold mb-2">{t('visual_search.results_found', { count: foundProducts.length })}</p>
                                        <ul className="space-y-2">{foundProducts.map(p => (
                                            <li key={p.id}><Link to="/products" onClick={onClose} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-md me-3" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700/50 rounded-md flex items-center justify-center me-3">
                                                        <ProductsIcon className="w-6 h-6 text-cyan-500"/>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                                                    <p className="text-sm text-gray-600 dark:text-slate-400">{p.category}</p>
                                                </div>
                                            </Link></li>
                                        ))}</ul>
                                    </>
                                ) : (
                                    <p className="text-center text-gray-600 dark:text-slate-400 py-8">{t('visual_search.no_results')}</p>
                                )}
                                <button onClick={handleRetry} className="mt-4 w-full bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-lg px-4 py-2 font-semibold">{t('visual_search.retry_button')}</button>
                            </div>
                        ) : (
                             <div className="p-4 flex-shrink-0">
                                <motion.button
                                    onClick={handleScan}
                                    disabled={scanState !== 'idle'}
                                    className="w-full h-12 flex items-center justify-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <CameraIcon className="w-6 h-6 me-2" />
                                    {t('visual_search.scan_button')}
                                </motion.button>
                             </div>
                        )}

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VisualSearchModal;