import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generateProductTitleAndCategory, getBestVisualMatch } from '../services/gemini';
import { Product } from '../types';
import { XIcon, CameraIcon, LoaderIcon, ProductsIcon, UploadIcon } from './Icons';

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

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose }) => {
    const { t, products } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
            setScanState('idle');
        }
        return stopCamera;
    }, [isOpen, startCamera, stopCamera]);

    const analyzeImageBlob = async (blob: Blob) => {
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
    };

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
                await analyzeImageBlob(blob);
            } else {
                setErrorMsg(t('visual_search.error.capture'));
                setScanState('error');
            }
        }, 'image/jpeg', 0.9);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            analyzeImageBlob(file);
        }
        // Reset file input value to allow selecting the same file again
        if(event.target) event.target.value = '';
    };

    const handleRetry = () => {
        setFoundProducts([]);
        setScanState('idle');
    };

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
                             <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
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
                                    <div className="text-center p-6">
                                        <p className="font-semibold mb-2">{t('visual_search.no_results')}</p>
                                        <button onClick={handleRetry} className="text-sm text-cyan-500 font-semibold">{t('visual_search.retry_button')}</button>
                                    </div>
                                )}
                                {scanState === 'error' && (
                                     <div className="text-center p-6">
                                        <p className="font-semibold text-red-500 mb-2">{errorMsg}</p>
                                        <button onClick={handleRetry} className="text-sm text-cyan-500 font-semibold">{t('visual_search.retry_button')}</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="p-4 flex items-center justify-center space-x-4">
                                <motion.button 
                                    onClick={handleScan}
                                    disabled={scanState !== 'idle'}
                                    className="flex-1 h-12 flex items-center justify-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <CameraIcon className="w-5 h-5 me-2" />
                                    {t('visual_search.scan_button')}
                                </motion.button>
                                <motion.button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={scanState !== 'idle'}
                                    className="flex-1 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-semibold rounded-lg disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <UploadIcon className="w-5 h-5 me-2" />
                                    {t('visual_search.upload_button')}
                                </motion.button>
                            </div>
                        )}

                        {scanState === 'no-camera' && (
                            <div className="p-4 text-center">
                                 <p className="font-semibold text-red-500 mb-2">{t('visual_search.error.no_camera')}</p>
                                 <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{t('visual_search.error.camera_permission')}</p>
                                 <motion.button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-12 w-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-semibold rounded-lg"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <UploadIcon className="w-5 h-5 me-2" />
                                    {t('visual_search.upload_button')}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
