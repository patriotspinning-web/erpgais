import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  actionTitle: string;
  onSuccess: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  onClose,
  actionTitle,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '@admin') {
      setError('');
      setPassword('');
      onSuccess();
      onClose();
    } else {
      setError('Invalid admin password. Default password is @admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-base font-bold">Admin Authorization Required</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <p className="font-bold">Restricted Operation</p>
              <p className="mt-0.5">
                You are performing: <span className="font-semibold underline">{actionTitle}</span>. Enter admin password to confirm.
              </p>
              <p className="mt-1 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                Default password: <code className="bg-amber-200/60 dark:bg-amber-900/80 px-1.5 py-0.5 rounded">@admin</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm text-slate-900 dark:text-white"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Verify & Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
