import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  indicatorColor?: string;
}

export function ProgressBar({ value, max = 100, className, indicatorColor }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let barBg = 'bg-brand-500';
  if (indicatorColor) {
    barBg = indicatorColor;
  } else if (percentage >= 100) {
    barBg = 'bg-rose-500';
  } else if (percentage >= 80) {
    barBg = 'bg-amber-500';
  }

  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full transition-all duration-500 ease-out rounded-full', barBg)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
