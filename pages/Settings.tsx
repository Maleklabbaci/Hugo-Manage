import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, LogoutIcon, LanguagesIcon, ServerIcon, AlertCircleIcon, DatabaseIcon, DuplicateIcon, MarkDeliveredIcon, ExternalLinkIcon, RunIcon, LoaderIcon } from '../components/Icons';
import type { Language, Theme } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../services/storage';

const sqlScript = `-- This script sets up the necessary storage bucket and policies for product images.
-- Run this in your Supabase SQL Editor to enable image uploads.

-- Clean up old policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;

-- 1. Create a public bucket for product images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Row Level Security (RLS) policies for the bucket.

-- 2.1. Allow public read access to all images.
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2.2. Allow authenticated users to upload images.
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 2.3. Allow users to update their own images.
CREATE POLICY "Allow users to update their own images"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (bucket_id = 'product-images');

-- 2.4. Allow users to delete their own images.
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
USING (auth.uid() = owner);`;

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t, logout, session, saveSupabaseCredentials, testStorageConnection } = useAppContext();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseError, setSupabaseError] = useState('');
  const [scriptCopied, setScriptCopied] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');


  useEffect(() => {
    const creds = storage.getSupabaseCredentials();
    if (creds.url) setSupabaseUrl(creds.url);
    if (creds.anonKey) setSupabaseAnonKey(creds.anonKey);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as Language);
  }

  const handleSupabaseSave = () => {
    setSupabaseError('');
    let finalUrl = supabaseUrl.trim();
    const anonKey = supabaseAnonKey.trim();

    if (!finalUrl || !anonKey) {
        setSupabaseError(t('settings.supabase.error_missing_fields'));
        return;
    }

    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }
    
    try {
        new URL(finalUrl);
    } catch(e) {
        setSupabaseError(t('settings.supabase.error_invalid_url'));
        return;
    }

    saveSupabaseCredentials(finalUrl, anonKey);
  };
  
  const handleCopyScript = () => {
    navigator.clipboard.writeText(sqlScript);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };
  
  const handleTestConnection = async () => {
      setTestState('testing');
      setTestError('');
      const result = await testStorageConnection();
      if (result.success) {
          setTestState('success');
      } else {
          setTestState('error');
          if (result.error === 'Bucket not found') {
              setTestError(t('settings.storage.test_error_bucket'));
          } else {
              setTestError(t('settings.storage.test_error_generic', { error: result.error || 'Unknown error' }));
          }
      }
  };

  const Step: React.FC<{ icon: React.ElementType, title: string, description: React.ReactNode }> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="font-semibold text-gray-800 dark:text-slate-200">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">{description}</p>
        </div>
    </div>
  );
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-gray-900 dark:text-white">

      <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-200 dark:border-white/10 flex items-center">
          <ServerIcon className="w-5 h-5 me-2" /> {t('settings.supabase.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{t('settings.supabase.description')}</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('settings.supabase.url_label')}</label>
            <input type="text" id="supabaseUrl" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="https://xxxx.supabase.co" />
          </div>
          <div>
            <label htmlFor="supabaseAnonKey" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('settings.supabase.anon_key_label')}</label>
            <input type="text" id="supabaseAnonKey" value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="ey..." />
          </div>
        </div>
        
        {supabaseError && (
             <motion.div 
              className="flex items-center p-3 mt-4 text-sm text-red-300 bg-red-900/50 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircleIcon className="w-5 h-5 me-2 flex-shrink-0" />
              <span>{supabaseError}</span>
            </motion.div>
        )}

        <div className="mt-4">
          <motion.button onClick={handleSupabaseSave} className="w-full bg-cyan-500/10 text-cyan-500 font-semibold rounded-lg px-4 py-2 flex items-center justify-center transition-colors hover:bg-cyan-500/20" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {t('settings.supabase.save_button')}
          </motion.button>
        </div>
      </div>
      
       <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-2 border-b pb-2 border-gray-200 dark:border-white/10 flex items-center">
          <DatabaseIcon className="w-5 h-5 me-2" /> {t('settings.storage.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{t('settings.storage.description')}</p>
        
        <div className="space-y-4">
          <Step icon={ExternalLinkIcon} title={t('settings.storage.step1_title')} description={
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-cyan-500 hover:underline">
                  {t('settings.storage.step1_desc')}
              </a>
          } />
          <Step icon={DatabaseIcon} title={t('settings.storage.step2_title')} description={t('settings.storage.step2_desc')} />
          <Step icon={DuplicateIcon} title={t('settings.storage.step3_title')} description={
            <>
              {t('settings.storage.step3_desc')}
              <pre className="bg-gray-100 dark:bg-black/20 p-2 mt-2 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-slate-200"><code>{sqlScript}</code></pre>
              <motion.button 
                  onClick={handleCopyScript} 
                  className={`w-full mt-2 font-semibold text-sm rounded-lg px-3 py-1.5 flex items-center justify-center transition-colors ${scriptCopied ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
              >
                  {scriptCopied ? <MarkDeliveredIcon className="w-4 h-4 me-2" /> : <DuplicateIcon className="w-4 h-4 me-2" />}
                  {scriptCopied ? t('settings.storage.copied_button') : t('settings.storage.copy_button')}
              </motion.button>
            </>
          } />
          <Step icon={RunIcon} title={t('settings.storage.step4_title')} description={t('settings.storage.step4_desc')} />
        </div>

        <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-4">
             <motion.button 
                onClick={handleTestConnection}
                disabled={testState === 'testing'}
                className="w-full font-semibold rounded-lg px-4 py-2 flex items-center justify-center transition-colors bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 disabled:opacity-60"
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
            >
                {testState === 'testing' ? (
                    <LoaderIcon className="w-5 h-5 me-2 animate-spin" />
                ) : (
                    <RunIcon className="w-5 h-5 me-2" />
                )}
                {testState === 'testing' ? t('settings.storage.testing') : t('settings.storage.test_button')}
            </motion.button>
        </div>

        <AnimatePresence>
            {testState === 'success' && (
                <motion.div
                    className="mt-4 p-3 bg-green-500/10 text-green-700 dark:text-green-300 rounded-lg flex items-center text-sm"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                    <MarkDeliveredIcon className="w-5 h-5 me-2" />
                    {t('settings.storage.test_success')}
                </motion.div>
            )}
            {testState === 'error' && testError && (
                <motion.div
                    className="mt-4 p-3 bg-red-500/10 text-red-700 dark:text-red-300 rounded-lg flex items-start text-sm"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                    <AlertCircleIcon className="w-5 h-5 me-2 flex-shrink-0 mt-0.5" />
                    <span>{testError}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-white/10">{t('settings.theme_title')}</h3>
        <div className="flex items-center justify-between">
          <p>{t('settings.theme_select')}</p>
          <div className="relative flex w-32 rounded-lg p-1 bg-gray-200 dark:bg-black/20">
            <button
              onClick={() => handleThemeChange('light')}
              className={`relative z-10 flex-1 p-2 rounded-md transition-colors text-center ${theme === 'light' ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}
            >
              <SunIcon className="w-5 h-5 mx-auto"/>
              {theme === 'light' && <motion.div layoutId="active-theme" className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-md shadow-lg -z-10" />}
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`relative z-10 flex-1 p-2 rounded-md transition-colors text-center ${theme === 'dark' ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}
            >
              <MoonIcon className="w-5 h-5 mx-auto"/>
              {theme === 'dark' && <motion.div layoutId="active-theme" className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-md shadow-lg -z-10" />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-white/10 flex items-center"><LanguagesIcon className="w-5 h-5 me-2"/> {t('settings.language_title')}</h3>
        <div className="flex items-center justify-between">
            <p>{t('settings.language_select')}</p>
            <select value={language} onChange={handleLanguageChange} className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-cyan-500 focus:border-cyan-500">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
            </select>
        </div>
      </div>

      {session && (
        <div>
          <motion.button
            onClick={logout}
            className="w-full bg-red-500/10 dark:bg-red-500/10 text-red-500 font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center transition-colors hover:bg-red-500/20"
            whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <LogoutIcon className="w-5 h-5 me-2"/>
            {t('settings.logout_button')}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default Settings;