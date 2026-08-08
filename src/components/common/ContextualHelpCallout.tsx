import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';

export interface ContextualHelpCalloutProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  icon?: 'lightbulb' | 'info' | 'help';
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const ContextualHelpCallout: React.FC<ContextualHelpCalloutProps> = ({
  title,
  description,
  children,
  icon = 'lightbulb',
  collapsible = false,
  defaultOpen = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const IconComponent =
    icon === 'info' ? Info : icon === 'help' ? HelpCircle : Lightbulb;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/90 dark:border-sky-800/70 text-xs text-sky-950 dark:text-sky-100 shadow-2xs transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-300/60 dark:border-sky-700/60 shrink-0 mt-0.5">
            <IconComponent size={16} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-extrabold text-sky-950 dark:text-sky-100 text-xs flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.2 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                Help & Guidance
              </span>
            </div>

            {description && (
              <p className="text-[11.5px] text-sky-800 dark:text-sky-300 leading-relaxed font-medium">
                {description}
              </p>
            )}

            {isOpen && children && <div className="pt-2 text-[11.5px]">{children}</div>}
          </div>
        </div>

        {collapsible && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? 'Collapse guidance' : 'Expand guidance'}
            className="p-1 text-sky-600 dark:text-sky-400 hover:bg-sky-200/50 dark:hover:bg-sky-900/50 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};
