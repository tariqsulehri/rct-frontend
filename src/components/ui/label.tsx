import React from 'react';
import { clsx } from 'clsx';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label: React.FC<LabelProps> = ({ className, children, ...props }) => (
  <label
    className={clsx('block text-sm font-medium text-gray-700', className)}
    {...props}
  >
    {children}
  </label>
);
