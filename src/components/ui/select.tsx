import React from 'react';
import { clsx } from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ className, children, ...props }) => (
  <select
    className={clsx(
      'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white',
      'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400',
      className,
    )}
    {...props}
  >
    {children}
  </select>
);

export const SelectTrigger = Select;
export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <option value="" disabled>{placeholder}</option>
);
export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
);
