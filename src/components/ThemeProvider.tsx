import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'midnight');
    if (theme === 'dark')     root.classList.add('dark');
    if (theme === 'midnight') root.classList.add('dark', 'midnight');
  }, [theme]);

  return <>{children}</>;
};
