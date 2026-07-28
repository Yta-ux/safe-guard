import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'right' | 'left';
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Position logic supporting alignment
  let positionClass = 'bottom-full mb-2 left-1/2 -translate-x-1/2';
  let arrowPosClass = 'top-full left-1/2 -translate-x-1/2 border-t-surface-container-highest border-x-transparent border-b-transparent';

  if (side === 'top') {
    if (align === 'right') {
      positionClass = 'bottom-full mb-2 right-0 translate-x-0';
      arrowPosClass = 'top-full right-3 border-t-surface-container-highest border-x-transparent border-b-transparent';
    } else if (align === 'left') {
      positionClass = 'bottom-full mb-2 left-0 translate-x-0';
      arrowPosClass = 'top-full left-3 border-t-surface-container-highest border-x-transparent border-b-transparent';
    } else {
      positionClass = 'bottom-full mb-2 left-1/2 -translate-x-1/2';
      arrowPosClass = 'top-full left-1/2 -translate-x-1/2 border-t-surface-container-highest border-x-transparent border-b-transparent';
    }
  } else if (side === 'bottom') {
    if (align === 'right') {
      positionClass = 'top-full mt-2 right-0 translate-x-0';
      arrowPosClass = 'bottom-full right-3 border-b-surface-container-highest border-x-transparent border-t-transparent';
    } else if (align === 'left') {
      positionClass = 'top-full mt-2 left-0 translate-x-0';
      arrowPosClass = 'bottom-full left-3 border-b-surface-container-highest border-x-transparent border-t-transparent';
    } else {
      positionClass = 'top-full mt-2 left-1/2 -translate-x-1/2';
      arrowPosClass = 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-container-highest border-x-transparent border-t-transparent';
    }
  } else if (side === 'left') {
    positionClass = 'right-full mr-2 top-1/2 -translate-y-1/2';
    arrowPosClass = 'left-full top-1/2 -translate-y-1/2 border-l-surface-container-highest border-y-transparent border-r-transparent';
  } else if (side === 'right') {
    positionClass = 'left-full ml-2 top-1/2 -translate-y-1/2';
    arrowPosClass = 'right-full top-1/2 -translate-y-1/2 border-r-surface-container-highest border-y-transparent border-l-transparent';
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-[100] max-w-[240px] w-max whitespace-normal text-left pointer-events-none transition-all duration-150 ease-out',
            'bg-surface-container-highest text-on-surface text-label-sm font-semibold leading-snug',
            'px-3 py-2 rounded-lg shadow-xl border border-outline-variant/80',
            'animate-in fade-in zoom-in-95',
            positionClass,
            className,
          )}
        >
          {content}
          <div className={cn('absolute w-0 h-0 border-4', arrowPosClass)} />
        </div>
      )}
    </div>
  );
}
