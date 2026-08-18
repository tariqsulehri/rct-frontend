import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface InfoTipProps {
  text: string;
  className?: string;
  size?: number;
}

/**
 * Universal Responsive & Collision-Aware InfoTip Component.
 * Automatically detects viewport edges (top, bottom, left, right) and flips
 * orientation dynamically so tooltips never hide under sticky bars or adjacent cards.
 */
export const InfoTip: React.FC<InfoTipProps> = ({ text, className = '', size = 13 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [positionClass, setPositionClass] = useState('bottom-full mb-2 right-0');
  const triggerRef = useRef<HTMLSpanElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    // Vertical flip: if near top (< 140px), open downwards
    const openDownwards = rect.top < 140;
    const vertical = openDownwards ? 'top-full mt-2' : 'bottom-full mb-2';

    // Horizontal flip: if near right (< 220px) align right-0, if near left (< 220px) align left-0, otherwise center
    let horizontal = 'right-0';
    if (rect.left < 220) {
      horizontal = 'left-0';
    } else if (rect.right > viewportWidth - 220) {
      horizontal = 'right-0';
    } else {
      horizontal = 'left-1/2 -translate-x-1/2';
    }

    setPositionClass(`${vertical} ${horizontal}`);
  };

  const handleMouseEnter = () => {
    calculatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => calculatePosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0 transition-colors"
        aria-label={text}
        onClick={(event) => {
          event.stopPropagation();
          calculatePosition();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => {
          calculatePosition();
          setIsOpen(true);
        }}
        onBlur={() => setIsOpen(false)}
      >
        <Info size={size} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" />
      </button>

      {isOpen && (
        <span
          role="tooltip"
          className={`absolute ${positionClass} z-[9999] w-64 max-w-[calc(100vw-2rem)] rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed shadow-elevated animate-fade-in pointer-events-none`}
          style={{
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--surface))',
            color: 'rgb(var(--text-1))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

