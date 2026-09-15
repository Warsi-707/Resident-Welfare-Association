import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, settings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const success = await login(username.trim(), undefined, password.trim());
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  const appTitle = settings?.associationName || 'Resident Welfare Association';

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#DCE7F5] overflow-hidden antialiased font-sans">
      {/* Left Ice-Blue / Cool Slate Section - Inspired by the uploaded swatch (slightly richer/tez) */}
      <div className="w-full lg:w-[56%] xl:w-[58%] bg-[#DCE7F5] flex flex-col justify-between items-center p-8 sm:p-12 lg:p-16 relative text-center border-b lg:border-b-0 lg:border-r border-slate-200/90">
        {/* Top spacer */}
        <div className="h-4 sm:h-8" />

        {/* Center Content: Logo positioned higher, Heading directly below, then Description */}
        <div className="my-auto pt-2 pb-8 space-y-6 max-w-lg flex flex-col items-center justify-center">
          {/* Logo Card in pure white with soft shadow */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border border-slate-200/80 shadow-xl flex items-center justify-center p-3 mb-2 transform -translate-y-2">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <Building2 className="w-14 h-14 text-slate-800" />
            )}
          </div>

          {/* Heading and Description */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {appTitle}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base font-normal max-w-md mx-auto leading-relaxed">
              Residential & commercial management system. Manage members, generate monthly challans, collect dues, and track financial accounts efficiently.
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-xs text-slate-500 font-medium pt-4 text-center">
          © {new Date().getFullYear()} {appTitle}. All rights reserved.
        </div>
      </div>

      {/* Right White Login Form Panel */}
      <div className="w-full lg:w-[44%] xl:w-[42%] bg-white flex flex-col justify-center px-6 sm:px-12 md:px-16 py-10 sm:py-14 relative min-h-[520px]">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Header Title */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F172A]" />
              <span>{appTitle}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Sign in to access your designated operational dashboard.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 bg-white focus:outline-none outline-none focus:border-[#0F172A] transition-all"
                required
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 text-sm rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 bg-white focus:outline-none outline-none focus:border-[#0F172A] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.99] shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 pt-3 mt-3"
            >
              {loading ? 'Signing in...' : 'Login Now'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer text-center"
            >
              Fill Admin Credentials (admin / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
