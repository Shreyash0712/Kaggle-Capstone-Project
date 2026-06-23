import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble, AgentPairRow } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ArbitratorScorecard } from './ArbitratorScorecard';
import { createSession, runDebate, getSession } from '../../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Data structure
interface Turn {
  id: string;
  userMessage?: string;
  advocateContent?: string;
  challengerContent?: string;
  detectiveContent?: string;
}

export const ChatInterface: React.FC = () => {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousTurnsLength = useRef(0);

  // Auto-scroll to top of new message ONLY when a new turn is added
  useEffect(() => {
    if (scrollRef.current && turns.length > previousTurnsLength.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    previousTurnsLength.current = turns.length;
  }, [turns.length]);

  // Load session from URL
  useEffect(() => {
    if (routeSessionId && routeSessionId !== sessionId) {
      setIsLoading(true);
      getSession(routeSessionId)
        .then(data => {
          setSessionId(data.session_id);
          setScorecard(data.scorecard);
          
          const newTurns: Turn[] = [];
          let currentTurn: Partial<Turn> = { id: 'premise', userMessage: data.user_premise };
          
          data.messages.forEach((msg: any) => {
            if (msg.agent_role === 'user' || msg.agent_role === 'human') {
              newTurns.push(currentTurn as Turn);
              currentTurn = { id: msg.id, userMessage: msg.content };
            } else {
              if (msg.agent_role === 'advocate') currentTurn.advocateContent = msg.content;
              else if (msg.agent_role === 'challenger') currentTurn.challengerContent = msg.content;
              else if (msg.agent_role === 'detective') currentTurn.detectiveContent = msg.content;
            }
          });
          newTurns.push(currentTurn as Turn);
          
          setTurns(newTurns);
        })
        .catch(err => {
          console.error("Failed to load session:", err);
          navigate('/'); // Redirect to new chat if not found
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!routeSessionId) {
      setSessionId(null);
      setTurns([]);
      setScorecard(null);
    }
  }, [routeSessionId, navigate]);

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const newTurnId = Date.now().toString();
    // Initialize with empty strings so ThinkingBubble shows up
    setTurns(prev => [...prev, { 
      id: newTurnId, 
      userMessage: message,
      advocateContent: '',
      challengerContent: '',
      detectiveContent: ''
    }]);
    setIsLoading(true);

    try {
      let currentSessionId = sessionId;
      let isNewSession = false;
      if (!currentSessionId) {
        const sessionRes = await createSession(message);
        currentSessionId = sessionRes.session_id;
        setSessionId(currentSessionId);
        isNewSession = true;
      }

      const queryToSend = sessionId ? message : '';
      const response = await runDebate(queryToSend, currentSessionId!);
      
      const { advocate_argument, challenger_argument, detective_questions, scorecard: newScorecard } = response.result;
      
      setTurns(prev => prev.map(turn => 
        turn.id === newTurnId ? {
          ...turn,
          advocateContent: advocate_argument,
          challengerContent: challenger_argument,
          detectiveContent: detective_questions,
        } : turn
      ));

      if (newScorecard) {
        setScorecard(newScorecard);
      }

      if (isNewSession) {
        navigate(`/chat/${currentSessionId}`);
      }
    } catch (error) {
      console.error("Failed to run debate", error);
      // Remove the thinking state if it failed
      setTurns(prev => prev.map(turn => 
        turn.id === newTurnId ? {
          ...turn,
          advocateContent: undefined,
          challengerContent: undefined,
          detectiveContent: undefined,
        } : turn
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4" // pt-20 to clear absolute header
      >
        <div className={`max-w-5xl mx-auto flex flex-col space-y-2 ${turns.length === 0 ? 'h-full justify-center' : ''}`}>
          {turns.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] -mt-20 animate-in fade-in zoom-in duration-500">
              <img src="/logo.svg" alt="Aletheox Logo" className="w-24 h-24 mb-6 drop-shadow-sm" />
              <p className="text-center max-w-md text-[var(--text-secondary)] leading-relaxed">
                State your premise. The Advocate and Challenger will debate its merits, while the Detective gathers context.
                {!user && (
                  <span className="block mt-2 text-[var(--text-primary)] font-medium">
                    Sign up to save your debates and access them later.
                  </span>
                )}
              </p>
            </div>
          ) : (
            turns.map((turn) => (
              <React.Fragment key={turn.id}>
                {turn.userMessage && (
                  <MessageBubble role="user" content={turn.userMessage} />
                )}
                
                {(turn.advocateContent !== undefined || turn.challengerContent !== undefined) && (
                  <AgentPairRow 
                    advocateContent={turn.advocateContent} 
                    challengerContent={turn.challengerContent} 
                  />
                )}
                
                {turn.detectiveContent !== undefined && (
                  <MessageBubble role="detective" content={turn.detectiveContent} />
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="opacity-100 transition-opacity">
        <ChatInput 
          onSend={handleSend} 
          onArbitratorClick={() => setIsScorecardOpen(true)}
          disabled={isLoading}
        />
      </div>

      {/* Modals */}
      {scorecard && (
        <ArbitratorScorecard
          isOpen={isScorecardOpen}
          onClose={() => setIsScorecardOpen(false)}
          advocateScore={scorecard.advocate_score || 50}
          challengerScore={scorecard.challenger_score || 50}
          confidenceScore={scorecard.confidence_score || 0}
          effectiveSummary={scorecard.effective_summary || "Awaiting further debate..."}
        />
      )}
    </div>
  );
};
