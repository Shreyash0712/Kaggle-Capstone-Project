import React from 'react';
import { Bot, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export type AgentRole = 'user' | 'advocate' | 'challenger' | 'detective' | 'system';

interface MessageProps {
  role: AgentRole;
  content: string;
}

export const MessageBubble: React.FC<MessageProps> = ({ role, content }) => {
  if (role === 'user') {
    return (
      <div className="flex justify-end w-full my-4 px-4 sm:px-0">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-5 py-3 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  if (role === 'detective') {
    return (
      <div className="flex w-full my-6 px-4 sm:px-0">
        <div className="flex gap-4 w-full">
          <div className="w-8 h-8 rounded-full bg-[var(--detective-bg)] border border-[var(--detective-border)] flex items-center justify-center flex-shrink-0 mt-1">
            <Search className="w-4 h-4 text-[var(--detective-text)]" />
          </div>
          <div className="flex-1 bg-[var(--detective-bg)] border border-[var(--detective-border)] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm text-[var(--text-primary)]">
            <h4 className="text-xs font-semibold text-[var(--detective-text)] uppercase tracking-wider mb-2">The Detective</h4>
            <div className="markdown-content whitespace-normal leading-relaxed text-sm">
              {content === '' ? (
                <div className="flex items-center gap-2 h-5 mt-1 opacity-70" style={{ color: 'var(--detective-text)' }}>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Advocate or Challenger
  const isAdvocate = role === 'advocate';
  const bgColor = isAdvocate ? 'var(--advocate-bg)' : 'var(--challenger-bg)';
  const borderColor = isAdvocate ? 'var(--advocate-border)' : 'var(--challenger-border)';
  const textColor = isAdvocate ? 'var(--advocate-text)' : 'var(--challenger-text)';
  const title = isAdvocate ? 'The Advocate' : 'The Challenger';

  return (
    <div className="flex w-full h-full">
      <div 
        className="flex gap-4 w-full rounded-2xl px-5 py-4 shadow-sm border transition-all"
        style={{ backgroundColor: bgColor, borderColor: borderColor }}
      >
        <div 
          className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center flex-shrink-0 mt-1"
          style={{ color: textColor }}
        >
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 text-[var(--text-primary)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textColor }}>
            {title}
          </h4>
          <div className="markdown-content whitespace-normal leading-relaxed text-sm">
            {content === '' ? (
              <div className="flex items-center gap-2 h-5 mt-1 opacity-70" style={{ color: textColor }}>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <ReactMarkdown>{content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgentPairRow: React.FC<{ advocateContent?: string, challengerContent?: string }> = ({ advocateContent, challengerContent }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 my-6 px-4 sm:px-0 w-full items-stretch">
      {advocateContent !== undefined && (
        <MessageBubble role="advocate" content={advocateContent} />
      )}
      {challengerContent !== undefined && (
        <MessageBubble role="challenger" content={challengerContent} />
      )}
    </div>
  );
};
