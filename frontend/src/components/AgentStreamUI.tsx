/**
 * @fileoverview OpenPath Component
 * @module Frontend/Components/AgentStreamUI
 * @description Handles the Server-Sent Events (SSE) connection to the LangGraph workflow and visualizes agent reasoning.
 * @dependencies [react, framer-motion, lucide-react]
 * @stateConsumed N/A
 * @stateProduced N/A
 */
import { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AgentStreamUIProps {
  onComplete?: (data: any) => void;
  onUpdate?: (data: any) => void;
  autoStart?: boolean;
  onSessionCreated?: (sessionId: string) => void;
}

interface StreamEvent {
  step: string;
  message?: string;
  updates?: any;
  final_recommendation?: string;
  discovered_repos?: any[];
  learning_gaps?: any[];
  selected_issue?: any;
  session_id?: string;
}

export default function AgentStreamUI({ onComplete, onUpdate, autoStart, onSessionCreated }: AgentStreamUIProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to hold the latest aggregated state
  const aggregatedState = useRef<any>({});

  const startAnalysis = () => {
    if (!user) return;
    
    setIsStreaming(true);
    setEvents([]);
    setError(null);
    aggregatedState.current = {};

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const eventSource = new EventSource(`${baseUrl}/api/mentor/analyze/stream?handle=${user.github_handle}`, {
      withCredentials: true
    });

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        
        if (data.step === 'error') {
          setError(data.message || 'An error occurred during analysis');
          eventSource.close();
          setIsStreaming(false);
          return;
        }

        if (data.step === 'init' && data.session_id) {
          if (onSessionCreated) onSessionCreated(data.session_id);
        }
        
        // Aggregate state
        if (data.final_recommendation) aggregatedState.current.final_recommendation = data.final_recommendation;
        if (data.discovered_repos) aggregatedState.current.discovered_repos = data.discovered_repos;
        if (data.learning_gaps) aggregatedState.current.learning_gaps = data.learning_gaps;
        if (data.selected_issue) aggregatedState.current.selected_issue = data.selected_issue;
        
        setEvents((prev) => [...prev, data]);
        
        // Pass aggregated state up
        if (onUpdate) {
          onUpdate({ ...aggregatedState.current });
        }
        
        if (data.step === 'complete') {
          eventSource.close();
          setIsStreaming(false);
          if (onComplete) {
             onComplete({ ...aggregatedState.current });
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed', err);
      setError('Connection to agent stream lost.');
      eventSource.close();
      setIsStreaming(false);
    };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  useEffect(() => {
    if (autoStart && !isStreaming && events.length === 0 && !error) {
      startAnalysis();
    }
  }, [autoStart, isStreaming, events.length, error]);

  return (
    <div className="flex flex-col w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-success" />
          Agent Reasoning Stream
        </h3>
        {!isStreaming && (
          <button 
            onClick={startAnalysis}
            className="text-sm bg-foreground text-background px-4 py-1.5 rounded-md font-medium hover:bg-foreground/90 transition-colors"
          >
            Start Analysis
          </button>
        )}
        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-success font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Agents Working...
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col gap-3 min-h-75 max-h-100 overflow-y-auto font-mono text-sm">
        {events.length === 0 && !isStreaming && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <Activity className="w-12 h-12 mb-2" />
            <p>Ready to analyze your profile and repositories.</p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          {events.map((ev, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border animate-in fade-in slide-in-from-left-2 duration-300"
            >
              {ev.step === 'complete' ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              ) : (
                <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-1">
                <span className="font-bold text-foreground">[{ev.step}]</span>
                {ev.message && <span className="text-muted-foreground">{ev.message}</span>}
                {ev.updates && (
                  <span className="text-success/80">Updated state fields: {Object.keys(ev.updates).join(', ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {error && (
          <div 
            className="flex items-start gap-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger animate-in fade-in duration-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
