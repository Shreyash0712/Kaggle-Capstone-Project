import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useChatSessions(user: any, chatId?: string, streamingSessionId?: string | null) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionData, setActiveSessionData] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const navigate = useNavigate();

  // Fetch History
  useEffect(() => {
    if (!user?.github_handle) return;
    const fetchSessions = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/api/mentor/sessions?handle=${user.github_handle}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (e) {
        console.error("Failed to fetch sessions", e);
      }
    };
    fetchSessions();
  }, [user?.github_handle]);

  // Handle active session selection based on URL
  useEffect(() => {
    if (chatId) {
      if (chatId !== streamingSessionId) {
        setIsStreaming(false);
        const session = sessions.find(s => s.id === chatId);
        if (session) {
          setActiveSessionData(session.result_data);
        } else {
          const fetchSingleSession = async () => {
            try {
              const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
              const res = await fetch(`${baseUrl}/api/mentor/sessions/${chatId}`);
              if (res.ok) {
                const data = await res.json();
                setActiveSessionData(data.session.result_data);
                setSessions(prev => prev.find(s => s.id === chatId) ? prev : [data.session, ...prev]);
              }
            } catch(e) {
               console.error("Failed to fetch session", e);
            }
          };
          fetchSingleSession();
        }
      }
    } else {
      setActiveSessionData(null);
    }
  }, [chatId, sessions, streamingSessionId]);

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/mentor/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (chatId === id) navigate('/chat');
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  return {
    sessions,
    activeSessionData,
    setActiveSessionData,
    isStreaming,
    setIsStreaming,
    deleteSession
  };
}
