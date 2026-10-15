import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';
    
    const variants = {
      primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-rose-900/20',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200/60',
      outline: 'border border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-600',
      ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
      destructive: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
      white: 'bg-white hover:bg-slate-50 text-brand-600 font-semibold shadow-sm border border-slate-100',
    };

    const sizes = {
      sm: 'text-xs h-8 px-3 rounded-lg gap-1.5',
      md: 'text-sm h-10 px-4 rounded-xl gap-2',
      lg: 'text-base h-12 px-6 rounded-xl gap-2.5 font-semibold',
      icon: 'h-10 w-10 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

