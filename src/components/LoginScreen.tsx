import React, { useState } from 'react';
import { Factory, Mail, Lock, Eye, EyeOff, Database, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { authenticateLocalUser, changeUserPassword } from '../config/authUsers';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Change Password Mode
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAuthSuccessMsg('');

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    // 1. Check local authorized credentials first
    const localUser = authenticateLocalUser(cleanEmail, cleanPass);
    if (localUser) {
      setAuthSuccessMsg('Authenticated successfully!');
      setTimeout(() => {
        onLogin(localUser);
      }, 300);
      return;
    }

    // 2. Fallback to Supabase Auth login
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (data?.user) {
        setAuthSuccessMsg('Authenticated with Supabase Cloud Auth!');
        const role = cleanEmail.toLowerCase().includes('admin') ? 'Super Admin' : 'Store Manager';
        setTimeout(() => {
          onLogin({
            name: data.user?.user_metadata?.full_name || cleanEmail.split('@')[0],
            email: data.user.email || cleanEmail,
            role,
          });
        }, 300);
        return;
      }

      if (authError) {
        setError(authError.message || 'Invalid email or password.');
      } else {
        setError('Invalid credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);

    if (newPassword.length < 6) {
      setResetStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    const res = await changeUserPassword(resetEmail, newPassword, oldPassword);

    if (res.success) {
      setResetStatus({
        type: 'success',
        message: 'Password updated successfully! You can now log in with your new password.',
      });
      setTimeout(() => {
        setEmail(resetEmail);
        setPassword('');
        setIsChangingPassword(false);
      }, 1500);
    } else {
      setResetStatus({ type: 'error', message: res.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 p-8 sm:p-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4">
            <Factory className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Patriot Spinning Mills
          </h2>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
            ERP Inventory System
          </p>
        </div>

        {!isChangingPassword ? (
          /* Sign In Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="name@patriot.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStatus(null);
                    setIsChangingPassword(true);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  Change Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Change Password Form on Login Screen */
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" /> Update Password
              </span>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="user@patriot.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {resetStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  resetStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{resetStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Updating Credentials...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Patriot Spinning Mills Ltd. • Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
};

