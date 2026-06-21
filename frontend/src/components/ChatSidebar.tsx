/**
 * @fileoverview OpenPath Component
 * @module Frontend/Components/ChatSidebar
 * @description Sidebar displaying history of analysis sessions and user controls.
 * @dependencies [lucide-react]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { PlusCircle, X, MessageSquare, Trash2 } from 'lucide-react';

interface ChatSidebarProps {
  user: any;
  sessions: any[];
  chatId?: string;
  isSidebarOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onSelectSession: (session: any) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onLogout: () => void;
}

export default function ChatSidebar({
  user,
  sessions,
  chatId,
  isSidebarOpen,
  onClose,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onLogout
}: ChatSidebarProps) {
  return (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      <aside className={`absolute md:relative z-40 w-72 border-r border-border bg-muted/30 flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-md">
              OP
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight hidden sm:block">OpenPath</span>
          </div>
          <div className="flex items-center">
            <button 
              onClick={onNewSession}
              className="flex items-center justify-center p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="New Chat"
            >
              <PlusCircle size={20} />
            </button>
            <button className="md:hidden ml-2 p-2 rounded-md bg-muted text-muted-foreground" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-4">No previous analysis.</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors group ${
                  chatId === session.id ? 'bg-muted border border-border shadow-sm' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <MessageSquare size={16} className="text-muted-foreground shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-foreground truncate">
                    Analysis #{session.id.substring(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div 
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-danger transition-opacity"
                  onClick={(e) => onDeleteSession(e, session.id)}
                  title="Delete chat"
                >
                  <Trash2 size={16} />
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-4 border-t border-border shrink-0 flex justify-between items-center bg-card">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">{user?.github_handle}</span>
          </div>
          <button onClick={onLogout} className="text-xs font-semibold text-danger hover:text-danger/80 hover:underline shrink-0 ml-2">Logout</button>
        </div>
      </aside>
    </>
  );
}
