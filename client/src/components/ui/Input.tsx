import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs sm:text-sm font-medium text-telegram-text-secondary mb-1.5 sm:mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-telegram-text-secondary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-telegram-bg-light border border-telegram-border rounded-xl',
              'px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-telegram-text-secondary',
              'focus:outline-none focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue',
              'transition-all duration-200 text-sm sm:text-base',
              leftIcon && 'pl-8 sm:pl-10',
              rightIcon && 'pr-8 sm:pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-telegram-text-secondary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-500 animate-fade-in">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-telegram-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
