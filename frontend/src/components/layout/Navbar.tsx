/**
 * @fileoverview OpenPath Component
 * @module Frontend/Components/Navbar
 * @description Global navigation bar with semantic theming and a light/dark toggle.
 * @dependencies [react-router-dom, lucide-react, ThemeContext]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { Link } from 'react-router-dom';
import { User, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="h-16 border-b border-border bg-background/95 backdrop-blur z-40 sticky top-0 flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-4">
          <Link 
            to="/chat" 
            className="text-muted-foreground font-medium text-sm transition-colors hover:text-foreground relative group"
          >
            Chats
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
          </Link>
          
          <button 
            onClick={toggleTheme}
            className="text-muted-foreground flex items-center justify-center w-9 h-9 rounded-full bg-muted transition-all hover:text-foreground hover:bg-muted-foreground/20 hover:-translate-y-0.5 cursor-pointer border-none"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Link 
            to="/profile" 
            className="text-muted-foreground flex items-center justify-center w-9 h-9 rounded-full bg-muted transition-all hover:text-foreground hover:bg-muted-foreground/20 hover:-translate-y-0.5"
          >
            <User size={18} />
          </Link>
          <Link 
            to="/preferences" 
            className="text-muted-foreground flex items-center justify-center w-9 h-9 rounded-full bg-muted transition-all hover:text-foreground hover:bg-muted-foreground/20 hover:-translate-y-0.5"
            title="Preferences"
          >
            <Settings size={18} />
          </Link>
        </div>
    </nav>
  );
}
