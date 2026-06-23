import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[var(--text-primary)] drop-shadow-sm" />
      ) : (
        <Sun className="w-5 h-5 text-[var(--text-primary)] drop-shadow-sm" />
      )}
    </button>
  );
};
