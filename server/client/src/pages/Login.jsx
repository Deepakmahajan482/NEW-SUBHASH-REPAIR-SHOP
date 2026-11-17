import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiSun, FiMoon, FiShield } from 'react-icons/fi';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login(data.email, data.password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 px-4 py-8 relative transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-cardHover shadow-xs transition-all"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <FiSun className="text-xl text-sky-400" /> : <FiMoon className="text-xl text-slate-700" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white dark:bg-[#121826] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-7 sm:p-9"
      >
        {/* Religious Blessing Header */}
        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6">
          <span className="inline-block px-4 py-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-700/50 rounded-full text-[#207ec0] dark:text-sky-300 font-extrabold text-sm tracking-wide">
            ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ
          </span>
        </div>

        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-[#2b90d9] overflow-hidden shadow-lg p-1.5 flex items-center justify-center mb-3">
            <img
              src="/logo.png"
              alt="New Subhash Repair Agency"
              className="w-full h-full object-cover scale-110"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            New Subhash Repair Agency
          </h1>
          <p className="text-sm font-bold text-[#2b90d9] dark:text-sky-400 mt-1">
            Tata Leyland & Leaf Spring Repair Portal
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Admin & Staff Authentication
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm font-semibold flex items-start gap-2.5">
            <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-lg">
                <FiMail />
              </div>
              <input
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1a2234] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9] focus:border-transparent transition-all"
                placeholder="admin@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-lg">
                <FiLock />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                })}
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-[#1a2234] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Sign In Button in Sky Blue */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#2b90d9] hover:bg-[#207ec0] active:scale-[0.99] text-white font-black text-base rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <FiShield className="text-lg" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} New Subhash Repair Agency. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
