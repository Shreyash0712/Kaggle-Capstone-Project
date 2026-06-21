/**
 * @fileoverview OpenPath Component
 * @module Frontend/Components/RepositoryCard
 * @description Card component to display repository details and recommended issues.
 * @dependencies [lucide-react, react-markdown, remark-gfm]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { ChevronDown, ChevronRight, GitPullRequest, BookOpen, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RepositoryCardProps {
  repo: any;
  isExpanded: boolean;
  isAnalyzed: boolean;
  onToggle: () => void;
  selectedIssue: any;
  learningGaps: any[];
}

export default function RepositoryCard({
  repo,
  isExpanded,
  isAnalyzed,
  onToggle,
  selectedIssue,
  learningGaps
}: RepositoryCardProps) {
  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-all duration-300">
      <button 
        onClick={onToggle}
        className="flex items-center justify-between p-5 bg-muted/30 hover:bg-muted/60 transition-colors text-left w-full"
      >
        <div className="flex items-center gap-4">
          {isExpanded ? <ChevronDown size={20} className="text-muted-foreground" /> : <ChevronRight size={20} className="text-muted-foreground" />}
          <div>
            <h3 className="font-bold text-lg text-foreground">{repo.repo_name}</h3>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded border border-border uppercase tracking-wider">{repo.primary_language || 'Unknown'}</span>
              {isAnalyzed && (
                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded border border-success/20 uppercase tracking-wider">Analyzed</span>
              )}
            </div>
          </div>
        </div>
        <a 
          href={`https://github.com/${repo.repo_name}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on GitHub
        </a>
      </button>
      
      {isExpanded && (
        <div className="p-5 border-t border-border animate-in slide-in-from-top-2 duration-300">
          <p className="text-foreground/90 mb-6">{repo.description}</p>
          
          {isAnalyzed && selectedIssue ? (
            <div className="flex flex-col gap-6">
              <div className="bg-muted p-5 rounded-lg border border-border">
                <h4 className="flex items-center gap-2 font-bold text-foreground mb-3">
                  <GitPullRequest size={18} className="text-primary" />
                  Recommended Issue
                  <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded ml-auto border ${selectedIssue.difficulty === 'Hard' ? 'border-danger/30 text-danger bg-danger/10' : selectedIssue.difficulty === 'Medium' ? 'border-warning/30 text-warning bg-warning/10' : 'border-success/30 text-success bg-success/10'}`}>
                    {selectedIssue.difficulty || 'Unknown'}
                  </span>
                </h4>
                <a href={selectedIssue.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline text-lg inline-block mb-2">
                  {selectedIssue.title}
                </a>
                <div className="text-sm text-muted-foreground mt-2 line-clamp-4 prose dark:prose-invert prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedIssue.body}
                  </ReactMarkdown>
                </div>
              </div>
              
              {learningGaps && learningGaps.length > 0 ? (
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-foreground mb-3">
                    <BookOpen size={18} className="text-success" />
                    Identified Learning Gaps
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {learningGaps.map((gap: any, gapIdx: number) => (
                      <li key={gapIdx} className="bg-background p-3 border border-border rounded-lg text-sm text-foreground/80 list-disc ml-5">
                        <span className="font-semibold text-foreground">{gap.topic ? `${gap.topic}: ` : ''}</span>
                        {gap.description || gap}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-success flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  No major technical learning gaps identified!
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Not deeply analyzed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
