import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, description, error, required, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-label-md text-on-surface flex items-center gap-2" htmlFor={id}>
            {label}
            {required && <span aria-hidden="true" className="text-error">*</span>}
          </label>
        )}
        {description && (
          <p className="text-body-md text-on-surface-variant mb-2">{description}</p>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-surface-bright border border-outline-variant rounded-lg p-4',
            'text-body-md text-on-surface placeholder:text-outline',
            'focus:border-primary focus:ring-2 focus:ring-primary-container focus:outline-none',
            'resize-none transition-shadow',
            error && 'border-error focus:border-error focus:ring-error-container',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-label-sm text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea };
