import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircleIcon, LoaderIcon, ChezHugoLogo } from '../components/Icons';
import { useAppContext } from '../context/AppContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, session, isConfigured, t } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError(t('settings.supabase.unconfigured_prefix'));
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = await login(email, password);
    if (authError) {
      console.error("Login failed:", authError);
      setError(t('login.error.incorrect_credentials'));
    }
    setLoading(false);
  };

  if (session) {
    const isMobile = window.innerWidth < 768;
    return <Navigate to={isMobile ? "/mobile-hub" : "/dashboard"} />;
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 text-white">
      <motion.div 
        className="w-full max-w-md p-8 space-y-6 bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center">
            <div className="flex justify-center mb-4">
               <ChezHugoLogo />
            </div>
          <p className="text-base text-slate-300">{t('login.subtitle')}</p>
        </div>
        
        {!isConfigured && (
            <motion.div 
              className="flex items-center p-3 text-sm text-amber-300 bg-amber-900/50 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircleIcon className="w-5 h-5 me-2 flex-shrink-0" />
              <span>
                  {t('settings.supabase.unconfigured_prefix')}{' '}
                  <Link to="/settings" className="font-bold underline hover:text-amber-200">
                      {t('settings.supabase.unconfigured_link_short')}
                  </Link>
              </span>
            </motion.div>
        )}
        
        <motion.form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-4">
            <motion.div variants={itemVariants}>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-300 mb-1">{t('login.email_placeholder')}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-600 bg-slate-900/70 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <label htmlFor="password"  className="block text-sm font-medium text-slate-300 mb-1">{t('login.password_placeholder')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-600 bg-slate-900/70 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm"
                placeholder="********"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </motion.div>
          </div>

          {error && (
            <motion.div 
              className="flex items-center p-3 text-sm text-red-300 bg-red-900/50 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircleIcon className="w-5 h-5 me-2" />
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              disabled={loading || !isConfigured}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-brand to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.3), 0 4px 6px -2px rgba(34, 211, 238, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
                {loading && <LoaderIcon className="animate-spin w-5 h-5 me-3" />}
              {t('login.submit_button')}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;