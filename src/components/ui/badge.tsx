import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-blue-500/15 text-blue-600 border-transparent hover:bg-blue-500/25',
  secondary: 'bg-gray-500/15 text-gray-600 border-transparent hover:bg-gray-500/25',
  destructive: 'bg-red-500/15 text-red-600 border-transparent hover:bg-red-500/25',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  success: 'bg-green-500/15 text-green-600 border-transparent hover:bg-green-500/25',
  warning: 'bg-yellow-500/15 text-yellow-600 border-transparent hover:bg-yellow-500/25',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
