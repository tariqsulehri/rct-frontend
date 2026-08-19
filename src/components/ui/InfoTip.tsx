import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export interface InfoTipProps {
  text: string | React.ReactNode;
  className?: string;
  size?: number;
  icon?: React.ReactNode;
}

export const InfoTip: React.FC<InfoTipProps> = ({ text, className = '', size = 13, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    let top = rect.top - 8;
    let left = rect.left + rect.width / 2;
    let transformX = '-50%';
    let transformY = '-100%';

    // Vertical flip
    if (rect.top < 140) {
      top = rect.bottom + 8;
      transformY = '0';
    }

    // Horizontal flip
    if (rect.left < 130) {
      left = rect.left;
      transformX = '0';
    } else if (rect.right > viewportWidth - 130) {
      left = rect.right;
      transformX = '-100%';
    }

    setFixedStyle({
      top: `${top}px`,
      left: `${left}px`,
      transform: `translate(${transformX}, ${transformY})`,
    });
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
        aria-label={typeof text === 'string' ? text : 'Information'}
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
        {icon ? icon : <Info size={size} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" />}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            className="fixed z-[99999] w-64 max-w-[calc(100vw-2rem)] rounded-xl border px-3.5 py-3 text-xs leading-relaxed shadow-elevated animate-fade-in pointer-events-none"
            style={{
              ...fixedStyle,
              borderColor: 'rgb(var(--border))',
              backgroundColor: 'rgb(var(--surface))',
              color: 'rgb(var(--text-1))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
};

