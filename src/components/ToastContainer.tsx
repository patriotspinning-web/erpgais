import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 right-6 z-[99] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3 min-w-[320px] max-w-md transform transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              t.type === 'success'
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                : t.type === 'error'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {t.type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {t.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {t.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
