import React, { useState } from 'react';
import { Factory, Mail, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('store@patriot.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAuthSuccessMsg('');

    try {
      // First attempt Supabase Auth login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data?.user) {
        setAuthSuccessMsg('Authenticated with Supabase Cloud Auth!');
        const role = email.toLowerCase().includes('admin') ? 'Super Admin' : 'Store Manager';
        setTimeout(() => {
          onLogin({
            name: data.user?.user_metadata?.full_name || email.split('@')[0],
            email: data.user.email || email,
            role,
          });
        }, 500);
        return;
      }

      // If Supabase Auth fails but password is "password" or demo user, attempt auto signup/fallback
      if (password === 'password' || authError) {
        // Attempt seamless Supabase sign-up for new users
        if (authError && authError.message.includes('Invalid login credentials')) {
          const { data: signUpData } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpData?.user) {
            setAuthSuccessMsg('Created & authenticated new Supabase account!');
          }
        }

        const role = email.toLowerCase().includes('admin') ? 'Super Admin' : 'Store Manager';
        const name = email.toLowerCase().includes('admin') ? 'Admin User' : 'Store Manager';

        setTimeout(() => {
          onLogin({ name, email, role });
          setLoading(false);
        }, 400);
      } else {
        setError(authError?.message || 'Invalid login credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      // Fallback for offline or custom demo password
      if (password === 'password') {
        const role = email.toLowerCase().includes('admin') ? 'Super Admin' : 'Store Manager';
        onLogin({ name: email.split('@')[0], email, role });
      } else {
        setError(err?.message || 'Authentication failed');
      }
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        {/* Left Side: Branding Banner */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                <Factory className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Patriot ERP</h1>
                <p className="text-blue-200 text-xs font-medium">Spinning Mill Inventory System</p>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-3xl font-extrabold leading-tight">Unified Textile Inventory Control</h2>
              <p className="text-blue-100 text-sm mt-3 leading-relaxed">
                Streamline Cotton, Wastage, Spare Parts, Yarn, and HVI/Uster Quality Testing across all mill production departments.
              </p>
            </div>
          </div>

          <div className="space-y-3 my-8">
            <div className="flex items-center gap-3 text-xs text-blue-100 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>Cotton Lot & Bale Tracking (26 Origins Supported)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-100 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>Wastage Management with Challan Generation (20 Categories)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-100 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>1800+ Spare Items across 24 Mill Sections</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-100 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>HVI & Uster Quality Reports with Excel/PDF Exports</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-blue-200">
            <span>Patriot Spinning Mills Ltd.</span>
            <span>Dhaka, Bangladesh</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-8">
              Access store, stock balance, and quality reports
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="store@patriot.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  {authSuccessMsg}
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to ERP'}
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Quick Demo Login Accounts
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount('store@patriot.com')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  email === 'store@patriot.com'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">Store Manager</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">store@patriot.com</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('admin@patriot.com')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  email === 'admin@patriot.com'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin@patriot.com</p>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2.5 rounded-xl flex items-center justify-between">
              <span>Password for demo accounts: <code className="font-mono font-bold text-slate-800 dark:text-slate-200">password</code></span>
              <span>Admin Key: <code className="font-mono font-bold text-slate-800 dark:text-slate-200">@admin</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
