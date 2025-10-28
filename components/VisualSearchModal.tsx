import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getDetailedVisualAnalysis } from '../services/gemini';
import { Product, ProductFormData } from '../types';
import { XIcon, CameraIcon, LoaderIcon, ProductsIcon, UploadIcon, SparklesIcon } from './Icons';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanState = 'initializing' | 'idle' | 'scanning' | 'analyzing' | 'analysis_complete' | 'error' | 'no-camera';
type AnalysisResult = {
    name: string;
    category: string;
    description: string;
    attributes: string[];
};


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
    const { t, products, findProductsByKeywords, setProductDataForForm } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [foundProducts, setFoundProducts] = useState<Product[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
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

    const resetState = useCallback(() => {
        setFoundProducts([]);
        setAnalysisResult(null);
        setCapturedImageBlob(null);
        setErrorMsg('');
        setAnalysisText('');
        setScanState('idle');
    }, []);

    useEffect(() => {
        if (isOpen) {
            setScanState('initializing');
            startCamera();
        } else {
            stopCamera();
            resetState();
        }
        return stopCamera;
    }, [isOpen, startCamera, stopCamera, resetState]);

    const analyzeImageBlob = async (blob: Blob) => {
        try {
            setScanState('analyzing');
            setCapturedImageBlob(blob);
            
            const uniqueCategories = [...new Set(products.map(p => p.category))];
            
            setAnalysisText(t('visual_search.performing_deep_analysis'));
            const base64Data = await blobToBase64(blob);
            const analysis = await getDetailedVisualAnalysis(base64Data, uniqueCategories);
            
            if (analysis) {
                setAnalysisResult(analysis);
                const searchKeywords = [analysis.name, ...analysis.attributes].join(' ');
                const matches = findProductsByKeywords(searchKeywords);
                setFoundProducts(matches.slice(0, 5));
            } else {
                setFoundProducts([]);
            }
            setScanState('analysis_complete');

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
        if(event.target) event.target.value = '';
    };
    
    const handleAddAsNew = () => {
        if (!analysisResult || !capturedImageBlob) return;
        const newProductData: ProductFormData & { imageBlob: Blob } = {
            name: analysisResult.name,
            description: analysisResult.description,
            category: analysisResult.category,
            supplier: '',
            buyPrice: 0,
            sellPrice: 0,
            stock: 1,
            imageFile: null,
            imageBlob: capturedImageBlob,
        };
        setProductDataForForm(newProductData);
        onClose();
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
                        className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg relative flex flex-col overflow-hidden max-h-[90vh]"
                        variants={modalVariants} onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{t('visual_search.title')}</h2>
                            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><XIcon /></button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto">
                            <div className="aspect-video bg-black relative">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className={`w-full h-full object-cover transition-opacity ${scanState === 'analysis_complete' ? 'opacity-20' : 'opacity-100'}`}
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
                        
                            {scanState === 'analysis_complete' || scanState === 'error' ? (
                                <div className="p-4">
                                    {analysisResult && (
                                        <div className="mb-4">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{t('visual_search.ai_suggestion')}</h3>
                                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                <p className="font-semibold">{analysisResult.name}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{analysisResult.category}</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{analysisResult.description}</p>
                                                <div className="mt-2">
                                                    <h4 className="text-xs font-bold text-slate-500 mb-1">{t('visual_search.attributes')}</h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {analysisResult.attributes.map((attr, i) => <span key={i} className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 rounded-full">{attr}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {foundProducts.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('visual_search.matching_products')}</h3>
                                            <ul className="space-y-2 max-h-40 overflow-y-auto">{foundProducts.map(p => (
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
                                        </div>
                                    )}

                                    {foundProducts.length === 0 && analysisResult && <p className="text-center text-sm text-slate-600 dark:text-slate-400 my-4">{t('visual_search.no_results')}</p>}

                                    {scanState === 'error' && (
                                         <div className="text-center p-6">
                                            <p className="font-semibold text-red-500 mb-2">{errorMsg}</p>
                                            <button onClick={resetState} className="text-sm text-cyan-500 font-semibold">{t('visual_search.retry_button')}</button>
                                        </div>
                                    )}
                                </div>
                            ) : null }

                            {scanState === 'no-camera' && (
                                <div className="p-4 text-center">
                                     <p className="font-semibold text-red-500 mb-2">{t('visual_search.error.no_camera')}</p>
                                     <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{t('visual_search.error.camera_permission')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 flex items-center justify-center space-x-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
                            {scanState === 'analysis_complete' ? (
                                <>
                                 <motion.button onClick={resetState} className="flex-1 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-semibold rounded-lg">
                                    {t('visual_search.retry_button')}
                                </motion.button>
                                <motion.button 
                                    onClick={handleAddAsNew}
                                    className="flex-1 h-12 flex items-center justify-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg"
                                >
                                    <SparklesIcon className="w-5 h-5 me-2" />
                                    {t('visual_search.add_as_new')}
                                </motion.button>
                                </>
                            ) : (
                                <>
                                <motion.button onClick={handleScan} disabled={scanState !== 'idle'} className="flex-1 h-12 flex items-center justify-center text-white bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold rounded-lg disabled:opacity-50">
                                    <CameraIcon className="w-5 h-5 me-2" />
                                    {t('visual_search.scan_button')}
                                </motion.button>
                                <motion.button onClick={() => fileInputRef.current?.click()} disabled={scanState !== 'idle'} className="flex-1 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-semibold rounded-lg disabled:opacity-50">
                                    <UploadIcon className="w-5 h-5 me-2" />
                                    {t('visual_search.upload_button')}
                                </motion.button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};