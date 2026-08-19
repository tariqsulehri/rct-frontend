import React from 'react';
import { useThemeStore } from '@/store/themeStore';

export interface CalibrLogoProps {
  /** Logo variation: 'horizontal' (full lockup), 'mark' (icon only), or 'stacked' */
  variant?: 'horizontal' | 'mark' | 'stacked';
  /** Additional CSS class names for styling or sizing */
  className?: string;
  /** Height of the logo image */
  height?: number | string;
  /** Width of the logo image */
  width?: number | string;
  /** Custom alt text */
  alt?: string;
}

/**
 * Enterprise Theme-Aware Calibr Logo Primitive.
 * Automatically switches between Light, Dark (glow-sm), and Midnight (glow-lg) assets
 * from the assets_v2 design system based on the active app theme.
 */
export const CalibrLogo: React.FC<CalibrLogoProps> = ({
  variant = 'horizontal',
  className = 'h-7 w-auto transition-all duration-300',
  height,
  width,
  alt = 'Calibr',
}) => {
  const theme = useThemeStore((state) => state.theme);

  // Map theme + variant to canonical assets_v2 SVG files
  const getLogoSrc = (): string => {
    if (variant === 'mark') {
      if (theme === 'midnight') return '/assets_v2/svg/calibr-mark-glow-midnight.svg';
      if (theme === 'dark') return '/assets_v2/svg/calibr-mark-glow-dark.svg';
      return '/assets_v2/svg/calibr-mark-color.svg';
    }

    if (variant === 'stacked') {
      if (theme === 'midnight') return '/assets_v2/svg/calibr-lockup-horizontal-glow-midnight.svg';
      if (theme === 'dark') return '/assets_v2/svg/calibr-lockup-horizontal-glow-dark.svg';
      return '/assets_v2/svg/calibr-lockup-stacked-color.svg';
    }

    // Default: 'horizontal'
    if (theme === 'midnight') return '/assets_v2/svg/calibr-lockup-horizontal-glow-midnight.svg';
    if (theme === 'dark') return '/assets_v2/svg/calibr-lockup-horizontal-glow-dark.svg';
    return '/assets_v2/svg/calibr-lockup-horizontal-color.svg';
  };

  return (
    <img
      src={getLogoSrc()}
      alt={alt}
      className={className}
      style={{
        height: height !== undefined ? height : undefined,
        width: width !== undefined ? width : undefined,
      }}
    />
  );
};
