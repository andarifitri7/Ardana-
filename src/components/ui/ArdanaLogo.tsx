import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ArdanaLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark';
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * Ardana Monogram Mark
 * Minimalist, geometric 'A' symbolizing upward financial ascent, stability & balance.
 */
export function ArdanaMark({
  size = 'md',
  theme = 'light',
  className,
  ...props
}: Omit<ArdanaLogoProps, 'variant'>) {
  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const isDark = theme === 'dark';
  const primaryColor = isDark ? '#FFFCFA' : '#641E32';
  const secondaryColor = isDark ? '#C98F9D' : '#812D46';
  const accentColor = isDark ? '#F5E8EB' : '#C98F9D';

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], 'shrink-0 transition-transform duration-200', className)}
      aria-label="Ardana Logo Mark"
      {...props}
    >
      <defs>
        <linearGradient id={`ardana-grad-${theme}`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="70%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={accentColor} />
        </linearGradient>
      </defs>

      {/* Main Arch 'A' — Architectural Ascent & Financial Flow */}
      <path
        d="M24 6L7 40H14.5L24 20L33.5 40H41L24 6Z"
        fill={`url(#ardana-grad-${theme})`}
      />

      {/* Financial Equilibrium Bridge (Negative Space Balance Bar) */}
      <path
        d="M17 29H31C32.1 29 32.7 30.3 32 31.2L30.5 33H17.5L16 31.2C15.3 30.3 15.9 29 17 29Z"
        fill={isDark ? '#30272A' : '#FFFCFA'}
      />

      {/* Center Pinnacle / Rising Delta Dot */}
      <circle
        cx="24"
        cy="26"
        r="2"
        fill={`url(#ardana-grad-${theme})`}
      />
    </svg>
  );
}

/**
 * Ardana Full Logo (Mark + Typography Wordmark)
 */
export function ArdanaLogo({
  size = 'md',
  variant = 'full',
  theme = 'light',
  className,
  ...props
}: ArdanaLogoProps) {
  if (variant === 'mark') {
    return <ArdanaMark size={size} theme={theme} className={className} {...props} />;
  }

  const isDark = theme === 'dark';
  const textSizeMap = {
    xs: 'text-sm tracking-wider',
    sm: 'text-base tracking-wider',
    md: 'text-xl tracking-wide',
    lg: 'text-2xl tracking-tight',
    xl: 'text-3xl tracking-tight',
  };

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
      {/* Icon Emblem Container */}
      <div
        className={cn(
          'rounded-xl flex items-center justify-center p-1.5 transition-all duration-200 group-hover:scale-105',
          isDark
            ? 'bg-brand-900/60 border border-brand-700/50 shadow-sm'
            : 'bg-[#F5E8EB]/80 border border-[#C98F9D]/30 shadow-xs'
        )}
      >
        <ArdanaMark size={size} theme={theme} {...props} />
      </div>

      {/* Typography Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'font-extrabold uppercase',
            textSizeMap[size],
            isDark ? 'text-[#FFFCFA]' : 'text-[#30272A]'
          )}
          style={{ letterSpacing: '0.08em' }}
        >
          ARD<span className={isDark ? 'text-[#C98F9D]' : 'text-[#812D46]'}>ANA</span>
        </span>
        <span
          className={cn(
            'text-[9px] font-semibold tracking-widest uppercase mt-0.5',
            isDark ? 'text-[#C98F9D]/80' : 'text-[#82777B]'
          )}
        >
          FINANCIAL MANAGEMENT
        </span>
      </div>
    </div>
  );
}
