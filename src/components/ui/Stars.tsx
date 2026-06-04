import React from 'react';

interface StarsProps {
  count: number;
  max?: number;
  size?: number;
  emptyColor?: string;
}

export const Stars: React.FC<StarsProps> = ({
  count,
  max = 5,
  size,
  emptyColor = 'rgb(var(--border-2))',
}) => (
  <span className="flex gap-0.5">
    {Array.from({ length: max }, (_, index) => {
      const starNumber = index + 1;
      return (
        <span
          key={starNumber}
          style={{
            color: starNumber <= count ? '#fbbf24' : emptyColor,
            ...(size ? { fontSize: size } : {}),
          }}
        >
          ★
        </span>
      );
    })}
  </span>
);
