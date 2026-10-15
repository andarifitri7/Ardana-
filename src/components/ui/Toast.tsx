'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export function showToast(options: Omit<ToastItem, 'id'>) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('tatadana_toast', {
    detail: {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: options.title,
      message: options.message,
      type: options.type || 'success',
      duration: options.duration || 3500,
    },
  });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 3500);

      timers.push(timer);
    };

    window.addEventListener('tatadana_toast', handleToast);
    return () => {
      window.removeEventListener('tatadana_toast', handleToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type;
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl transition-all duration-300 animate-fade-in border',
              'bg-[#FFFCFA] text-[#30272A]',
              isSuccess && 'border-brand-500/30 shadow-brand-900/10',
              isError && 'border-red-300 shadow-red-900/10',
              isInfo && 'border-slate-300 shadow-slate-900/10'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-200">
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                </div>
              )}
              {isError && (
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              )}
              {isInfo && (
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                  <Info className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1 text-left">
              {toast.title && (
                <h5 className="text-xs font-bold text-slate-900 tracking-tight leading-snug">
                  {toast.title}
                </h5>
              )}
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
