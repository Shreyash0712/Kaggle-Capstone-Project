/**
 * @fileoverview OpenPath Component
 * @module Frontend/Components/ChatResult
 * @description Displays the final recommendation and discovered repositories.
 * @dependencies [lucide-react, react-markdown, remark-gfm]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RepositoryCard from './RepositoryCard';

interface ChatResultProps {
  activeSessionData: any;
  expandedRepo: string | null;
  setExpandedRepo: (repo: string | null) => void;
}

export default function ChatResult({ activeSessionData, expandedRepo, setExpandedRepo }: ChatResultProps) {
  if (!activeSessionData) return null;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {activeSessionData.final_recommendation && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0 mt-1">
            <Code size={16} className="text-white" />
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="prose dark:prose-invert text-foreground max-w-none prose-emerald prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeSessionData.final_recommendation}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {activeSessionData.discovered_repos && activeSessionData.discovered_repos.length > 0 && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
            <Code size={16} className="text-white" />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {activeSessionData.discovered_repos.map((repo: any, idx: number) => {
              const isExpanded = expandedRepo === repo.repo_name;
              const isAnalyzed = activeSessionData?.selected_issue?.repo_name === repo.repo_name;
              
              return (
                <RepositoryCard 
                  key={idx}
                  repo={repo}
                  isExpanded={isExpanded}
                  isAnalyzed={isAnalyzed}
                  onToggle={() => setExpandedRepo(isExpanded ? null : repo.repo_name)}
                  selectedIssue={activeSessionData.selected_issue}
                  learningGaps={activeSessionData.learning_gaps}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
