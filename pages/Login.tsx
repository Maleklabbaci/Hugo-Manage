import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircleIcon, LoaderIcon } from '../components/Icons';
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
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div 
        className="w-full max-w-md p-8 space-y-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center">
            <svg className="w-12 h-12 text-cyan-400 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          <h1 className="mt-4 text-3xl font-bold text-white">{t('login.title')}</h1>
          <p className="mt-2 text-base text-slate-300">{t('login.subtitle')}</p>
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
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-300 mb-1">{t('login.email_placeholder')}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-white/20 bg-white/10 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-slate-300 mb-1">{t('login.password_placeholder')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-4 py-3 border border-white/20 bg-white/10 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="********"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
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

          <div>
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50 hover:-translate-y-0.5 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0"
            >
                {loading && <LoaderIcon className="animate-spin w-5 h-5 me-3" />}
              {t('login.submit_button')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;