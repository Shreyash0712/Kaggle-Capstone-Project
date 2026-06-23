import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronLeft } from 'lucide-react';
import { PastChatsList, type PastChat } from './PastChatsList';
import { SettingsModal } from './SettingsModal';
import { getUserSessions, deleteSession } from '../../api/client';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pastChats, setPastChats] = useState<PastChat[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const currentSessionId = location.pathname.startsWith('/chat/') ? location.pathname.split('/chat/')[1] : undefined;

  const fetchChats = () => {
    if (user) {
      getUserSessions()
        .then(sessions => {
          setPastChats(sessions.map((s: any) => ({
            id: s.session_id,
            title: s.user_premise || 'Untitled Debate'
          })));
        })
        .catch(err => {
          console.error('Failed to fetch past chats:', err);
          setPastChats([]);
        });
    } else {
      setPastChats([]);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  const handleDeleteSession = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSession(chatId);
      setPastChats(prev => prev.filter(c => c.id !== chatId));
      if (currentSessionId === chatId) {
        navigate('/');
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  if (!user) {
    return null; // Don't render sidebar if not logged in
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={onClose} />
      )}
      <aside className={`fixed md:relative z-30 w-64 flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:-ml-64'}`}>
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <img src="/favicon.svg" alt="Aletheox Logo" className="w-6 h-6" />
            Aletheox
          </h2>
          <div className="flex items-center gap-1">
            <button 
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
              onClick={onClose}
              title="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

      <PastChatsList 
        chats={pastChats} 
        currentSessionId={currentSessionId}
        onChatSelect={(id) => {
          navigate(`/chat/${id}`);
          onClose?.();
        }} 
        onDeleteSession={handleDeleteSession}
      />

      <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
        <div 
          className="flex items-center gap-2 overflow-hidden mr-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowSettings(true)}
          title="Open Settings"
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center flex-shrink-0 font-bold uppercase">
              {(user.name || user.email)[0]}
            </div>
          )}
          <div className="text-sm truncate font-medium" title={user.name || user.email}>
            {user.name || user.email}
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>

    <SettingsModal 
      isOpen={showSettings} 
      onClose={() => setShowSettings(false)} 
      onChatsDeleted={fetchChats}
    />
    </>
  );
};
