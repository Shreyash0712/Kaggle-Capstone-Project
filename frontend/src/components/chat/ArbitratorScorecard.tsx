import React from 'react';
import { X, AlertTriangle, Activity, Scale } from 'lucide-react';

interface ScorecardProps {
  isOpen: boolean;
  onClose: () => void;
  advocateScore: number;
  challengerScore: number;
  confidenceScore: number;
  effectiveSummary: string;
}

export const ArbitratorScorecard: React.FC<ScorecardProps> = ({
  isOpen,
  onClose,
  advocateScore,
  challengerScore,
  confidenceScore,
  effectiveSummary,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-[var(--bg-primary)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-[var(--border-color)]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 flex justify-between items-center bg-[var(--bg-secondary)] border-b border-[var(--border-color)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-wide text-[var(--text-primary)]">The Verdict</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded-full hover:bg-[var(--bg-primary)] shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
          
          {/* Score Bar */}
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <div className="text-center">
                <span className="block text-sm font-semibold uppercase tracking-wider text-[var(--advocate-text)]">Advocate</span>
                <span className="text-3xl font-bold">{advocateScore}</span>
              </div>
              
              <div className="text-center pb-2">
                <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-widest">VS</span>
              </div>

              <div className="text-center">
                <span className="block text-sm font-semibold uppercase tracking-wider text-[var(--challenger-text)]">Challenger</span>
                <span className="text-3xl font-bold">{challengerScore}</span>
              </div>
            </div>

            <div className="h-4 w-full rounded-full overflow-hidden flex bg-[var(--bg-secondary)] shadow-inner">
              <div 
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${advocateScore}%`, backgroundColor: 'var(--advocate-text)' }}
              ></div>
              <div 
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${challengerScore}%`, backgroundColor: 'var(--challenger-text)' }}
              ></div>
            </div>
            
            <div className="text-center mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                <Activity className="w-3.5 h-3.5" />
                Confidence Score: {confidenceScore}/100
              </span>
            </div>
          </div>

          {/* Effective Summary */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-5 sm:p-6 border border-[var(--border-color)]">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Effective Summary
            </h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {effectiveSummary || "The debate is still in its early stages. Keep exploring the premise to formulate a robust verdict."}
            </p>
          </div>
          
          <div className="text-center">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
            >
              Resume Debate
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
