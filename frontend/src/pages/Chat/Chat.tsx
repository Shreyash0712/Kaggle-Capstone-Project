/**
 * @fileoverview OpenPath Component
 * @module Frontend/Pages/Chat
 * @description Main dashboard page serving as layout coordinator for analysis sessions.
 * @dependencies [lucide-react, react-router-dom]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSessions } from '../../hooks/useChatSessions';
import Navbar from '../../components/layout/Navbar';
import Preferences from '../../components/Preferences';
import AgentStreamUI from '../../components/AgentStreamUI';
import ChatSidebar from '../../components/ChatSidebar';
import ChatResult from '../../components/ChatResult';

export default function Chat() {
  const { user, logout } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [streamingSessionId, setStreamingSessionId] = useState<string | null>(null);

  const {
    sessions,
    activeSessionData,
    setActiveSessionData,
    isStreaming,
    setIsStreaming,
    deleteSession
  } = useChatSessions(user, chatId, streamingSessionId);

  const handleSessionClick = (session: any) => {
    navigate(`/chat/${session.id}`);
    setIsSidebarOpen(false);
  };

  const startNewSession = () => {
    navigate('/chat');
    setIsSidebarOpen(false);
  };

  const handleAnalysisComplete = (data: any) => {
    setActiveSessionData(data);
    if (data?.selected_issue?.repo_name && !expandedRepo) setExpandedRepo(data.selected_issue.repo_name);
    setIsStreaming(false);
    setStreamingSessionId(null);
    if (data.session_id) navigate(`/chat/${data.session_id}`, { replace: true });
    else if (!chatId) navigate('/chat');
  };

  // If we are exactly at /chat and not streaming, we show the preferences component.
  const showNewAnalysis = !chatId && !isStreaming;

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      <ChatSidebar
        user={user}
        sessions={sessions}
        chatId={chatId}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewSession={startNewSession}
        onSelectSession={handleSessionClick}
        onDeleteSession={deleteSession}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto w-full relative">
          <div className="md:hidden flex items-center p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md bg-muted text-foreground">
              <Menu size={20} />
            </button>
            <span className="ml-3 font-semibold text-foreground truncate">OpenPath</span>
          </div>

          <div className="max-w-6xl w-full mx-auto flex flex-col gap-8 p-6 md:p-8 pb-20">
            {showNewAnalysis && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Preferences onProceed={() => { setIsStreaming(true); setActiveSessionData(null); }} />
              </div>
            )}

            {isStreaming && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <AgentStreamUI 
                   onUpdate={setActiveSessionData} 
                   onComplete={handleAnalysisComplete} 
                   autoStart={true}
                   onSessionCreated={(id) => { setStreamingSessionId(id); navigate(`/chat/${id}`); }}
                 />
              </div>
            )}

            {/* Render results with key based on chatId so it refreshes cleanly on navigation */}
            <div key={chatId || 'new'} className="w-full">
              <ChatResult 
                activeSessionData={activeSessionData}
                expandedRepo={expandedRepo}
                setExpandedRepo={setExpandedRepo}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
