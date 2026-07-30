import { forwardRef, cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      children,
      icon,
      iconPosition = 'right',
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';

    const sizes = {
      sm: 'px-4 py-1.5 text-xs rounded-md gap-1.5',
      md: 'px-6 py-2.5 text-sm rounded-lg gap-2',
      lg: 'px-8 py-3.5 text-base rounded-xl gap-2.5',
    };

    const variants = {
      primary:
        'bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-primary/85 shadow-sm hover:shadow-md focus:ring-primary',
      secondary:
        'bg-surface-container-lowest text-primary border-2 border-primary/50 hover:border-primary hover:bg-primary/10 focus:ring-primary shadow-xs hover:shadow-sm',
      ghost:
        'text-primary hover:bg-primary/15 hover:underline focus:ring-primary',
      danger:
        'bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white dark:text-red-400 dark:hover:text-white focus:ring-red-500 shadow-xs',
    };


    const iconSizes = {
      sm: 14,
      md: 18,
      lg: 20,
    };

    const renderIcon = (iconNode: ReactNode) => {
      if (isValidElement<{ size?: number; className?: string }>(iconNode)) {
        return cloneElement(iconNode, {
          size: iconNode.props.size ?? iconSizes[size],
          className: cn('shrink-0', iconNode.props.className),
        });
      }
      return iconNode;
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, sizes[size], variants[variant], className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 size={iconSizes[size]} className="animate-spin shrink-0" />}
        {!isLoading && icon && iconPosition === 'left' && renderIcon(icon)}
        <span>{children}</span>
        {!isLoading && icon && iconPosition === 'right' && renderIcon(icon)}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };
