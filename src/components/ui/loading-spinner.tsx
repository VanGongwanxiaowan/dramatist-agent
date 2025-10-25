import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'accent';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent'
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <span className={cn("text-sm", variantClasses[variant])}>
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
