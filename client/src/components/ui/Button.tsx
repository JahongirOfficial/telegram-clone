import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-telegram-blue hover:bg-telegram-blue-dark text-white shadow-lg shadow-telegram-blue/25',
      secondary:
        'bg-telegram-bg-light hover:bg-telegram-bg-lighter text-white border border-telegram-border',
      ghost: 'bg-transparent hover:bg-telegram-bg-light text-telegram-text-secondary',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    const sizes = {
      sm: 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm',
      md: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base',
      lg: 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-telegram-blue focus:ring-offset-2 focus:ring-offset-telegram-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-telegram-blue',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
