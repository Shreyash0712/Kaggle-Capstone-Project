import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  
  return (
    <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col relative">
        {/* Header containing Theme Toggle and potentially Login button if not authed */}
        <header className="absolute top-0 w-full p-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {user && !isSidebarOpen && (
              <button 
                className="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(true)}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
             {!user && (
                 <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
                     Login
                 </button>
             )}
             <ThemeToggle />
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
