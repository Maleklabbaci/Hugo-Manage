import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { XIcon, BotIcon, LoaderIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import type { ChatMessage } from '../types';
import { getAssistantResponse, startNewChat } from '../services/gemini';
import { GenerateContentResponse } from '@google/genai';

interface ConversationalAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConversationalAssistant: React.FC<ConversationalAssistantProps> = ({ isOpen, onClose }) => {
    const { t, addSale, findProductByName, addProduct, sales, products } = useAppContext();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    
    useEffect(() => {
      if (isOpen) {
        startNewChat();
        setMessages([{
            id: 'initial',
            role: 'model',
            parts: [{ text: t('ai_assistant.welcome_message') }]
        }]);
      }
    }, [isOpen, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', parts: [{ text: input }] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getAssistantResponse(newMessages);
            await processResponse(response);
        } catch (error) {
            console.error("Assistant error:", error);
            setMessages(prev => [...prev, { id: 'error', role: 'model', parts: [{ text: t('ai_assistant.api_error') }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const processResponse = async (response: GenerateContentResponse) => {
        const functionCalls = response.functionCalls;
        
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const { name, args } = call;
            let result: any = { status: 'ERROR', message: t('ai_assistant.tool_error') };

            // --- TOOL EXECUTION LOGIC ---
            if (name === 'addSale') {
                const foundProducts = findProductByName(args.productName);
                if (foundProducts.length === 1) {
                    await addSale(foundProducts[0].id, args.quantity);
                    result = { status: 'OK', message: t('ai_assistant.action_success') };
                } else if (foundProducts.length > 1) {
                    result = { status: 'AMBIGUOUS', message: t('ai_assistant.products_ambiguous', { productNames: foundProducts.map(p => p.name).join(', ') }) };
                } else {
                    result = { status: 'NOT_FOUND', message: t('ai_assistant.product_not_found', { productName: args.productName }) };
                }
            } else if (name === 'addProduct') {
                const newProd = { ...args, imageFile: null };
                const created = await addProduct(newProd);
                if (created) result = { status: 'OK', message: `Product "${created.name}" created.` };
            } else if (name === 'navigateTo') {
                navigate(`/${args.page}`);
                result = { status: 'OK', message: `Navigating to ${args.page}.`};
            } else if (name === 'getSalesInfo') {
                // This is a simplified version. A real implementation would filter sales by timeRange.
                const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
                const totalProfit = sales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);
                result = { status: 'OK', data: { totalRevenue, totalProfit } };
            } else if (name === 'getProductInfo') {
                 let results = products;
                 if (args.productName) results = findProductByName(args.productName);
                 if (args.category) results = results.filter(p => p.category.toLowerCase() === args.category.toLowerCase());
                 if (args.supplier) results = results.filter(p => p.supplier.toLowerCase() === args.supplier.toLowerCase());
                 if (args.stockLevel === 'low') results = results.filter(p => p.stock > 0 && p.stock <= 5);
                 if (args.stockLevel === 'out_of_stock') results = results.filter(p => p.stock === 0);
                 result = { status: 'OK', data: results.map(p => ({name: p.name, stock: p.stock, price: p.sellPrice})) };
            }
            
            const functionResponseMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'function',
                parts: [{ functionResponse: { name, response: result } }]
            };

            const response2 = await getAssistantResponse([...messages, functionResponseMessage]);
            processResponse(response2); // Recursively process the new response
            
        } else {
            const text = response.text;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', parts: [{ text }] }]);
        }
    };
    
    const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
    const assistantVariants: Variants = {
        hidden: { y: "100%", opacity: 0 },
        visible: { y: "0%", opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end"
            initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl border-t border-gray-200 dark:border-white/10 rounded-t-2xl shadow-xl w-full max-w-2xl h-[70vh] flex flex-col"
                variants={assistantVariants}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <div className="flex items-center">
                        <BotIcon className="w-6 h-6 text-cyan-500 me-3" />
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white">{t('ai_assistant.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <BotIcon className="w-6 h-6 text-slate-400 flex-shrink-0 mb-1" />}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                                msg.role === 'user'
                                ? 'bg-cyan-500 text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none'
                            }`}>
                                <p className="text-sm">{msg.parts[0]?.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                            <BotIcon className="w-6 h-6 text-slate-400 flex-shrink-0 mb-1" />
                            <div className="max-w-xs px-4 py-2 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none">
                                <p className="text-sm italic text-gray-500 dark:text-slate-400">{t('ai_assistant.thinking')}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-white/10">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('ai_assistant.placeholder')}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={isLoading}
                    />
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ConversationalAssistant;
