import React, { useState, useRef, useEffect } from 'react';
import { Send, Scale } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onArbitratorClick: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onArbitratorClick, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to default first
      textareaRef.current.style.height = 'auto';
      // Only expand based on scrollHeight if there is actual input text.
      // This prevents a long wrapping placeholder from making the empty input artificially tall.
      if (input) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div 
      className="p-4 sm:p-6 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent sticky bottom-0 w-full flex justify-center"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="w-full max-w-4xl relative flex items-end gap-2">
        <form 
          onSubmit={handleSubmit}
          className="flex-1 relative flex items-end gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-2 shadow-sm transition-shadow focus-within:ring-1 focus-within:border-[var(--text-primary)] focus-within:ring-[var(--text-primary)]"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="State your premise..."
            className="w-full max-h-[200px] bg-transparent border-none focus:ring-0 outline-none resize-none py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] leading-relaxed"
            rows={1}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="p-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-1 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <button
          onClick={onArbitratorClick}
          className="p-4 text-[var(--arbitrator-text)] rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all mb-1 shrink-0 group relative"
          style={{ background: 'var(--arbitrator-bg)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--arbitrator-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--arbitrator-bg)'}
          title="Summon Arbitrator"
        >
          <Scale className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-semibold px-2 py-1 rounded border border-[var(--border-color)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Verdict & Score
          </span>
        </button>
      </div>
    </div>
  );
};
