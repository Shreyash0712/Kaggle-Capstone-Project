import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// The title will be derived from the first message of the chat
export interface PastChat {
  id: string;
  title: string;
}

interface PastChatsListProps {
  chats: PastChat[];
  currentSessionId?: string;
  onChatSelect?: (chatId: string) => void;
  onDeleteSession?: (chatId: string, e: React.MouseEvent) => void;
}

export const PastChatsList: React.FC<PastChatsListProps> = ({ chats, currentSessionId, onChatSelect, onDeleteSession }) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Past Debates
        </div>
        <button 
          onClick={() => navigate('/')}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="New Debate"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {chats.length === 0 ? (
        <div className="text-sm text-[var(--text-secondary)] italic px-1">
          No past debates found.
        </div>
      ) : (
        chats.map(chat => {
          const isActive = chat.id === currentSessionId;
          return (
            <div 
              key={chat.id}
              className={`group flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-black/10 dark:bg-white/10 font-medium text-[var(--text-primary)] border border-black/5 dark:border-white/5' 
                  : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onClick={() => onChatSelect?.(chat.id)}
            >
              <span className="truncate flex-1 pr-2" title={chat.title}>{chat.title}</span>
              {onDeleteSession && (
                <button
                  onClick={(e) => onDeleteSession(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-secondary)] hover:text-red-500 rounded transition-all focus:opacity-100"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
