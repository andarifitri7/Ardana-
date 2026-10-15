import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'slate' | 'outline';
}

export function Badge({ className, variant = 'brand', children, ...props }: BadgeProps) {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
