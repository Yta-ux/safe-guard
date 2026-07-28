import { useState, useRef, useCallback, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Accordion({ title, icon, children, className }: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'w-full bg-primary text-on-primary py-4 px-6 flex items-center justify-between',
          'text-headline-md font-semibold transition-all duration-300',
          'hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer',
          isExpanded ? 'rounded-t-xl' : 'rounded-xl',
        )}
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-3">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={22}
          className={cn(
            'transition-transform duration-300',
            isExpanded && 'rotate-180',
          )}
        />
      </button>
      <div
        ref={contentRef}
        className={cn(
          'overflow-hidden transition-all duration-500 ease-in-out',
          'bg-surface-container-lowest border border-t-0 border-outline-variant',
          isExpanded ? 'max-h-[1000px] opacity-100 rounded-b-xl' : 'max-h-0 opacity-0 border-0',
        )}
      >
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
