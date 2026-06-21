/**
 * @fileoverview OpenPath Component
 * @module Frontend/Pages/Preferences
 * @description Preferences page for users to configure their open-source contribution preferences.
 * @dependencies [react, framer-motion, lucide-react]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';


const TECHNOLOGIES = ['Python', 'TypeScript', 'JavaScript', 'Rust', 'Go', 'Java', 'C++', 'React', 'FastAPI', 'Node.js'];
const ISSUE_TYPES = ['Good First Issue', 'Bug', 'Feature', 'Documentation', 'Enhancement'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const INTERESTS = ['AI/ML', 'Web Development', 'DevOps', 'Data Science', 'Security', 'Education'];

export default function Preferences({ onProceed }: { onProceed?: () => void }) {
  
  const [preferences, setPreferences] = useState<{
    technologies: string[];
    issue_types: string[];
    difficulty: string;
    interests: string[];
  }>({
    technologies: [],
    issue_types: [],
    difficulty: 'Beginner',
    interests: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/api/v1/users/me/preferences`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setPreferences({
            technologies: data.technologies || [],
            issue_types: data.issue_types || [],
            difficulty: data.difficulty || 'Beginner',
            interests: data.interests || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch preferences", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/v1/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to save preferences');
      
      if (onProceed) {
        onProceed();
      } else {
        setMessage({ text: 'Preferences saved successfully!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to start analysis. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (key: 'technologies' | 'issue_types' | 'interests', value: string) => {
    setPreferences(prev => {
      const array = prev[key];
      return {
        ...prev,
        [key]: array.includes(value) ? array.filter(i => i !== value) : [...array, value]
      };
    });
  };

  if (loading) return <div className="flex h-full items-center justify-center p-8"><span className="text-muted-foreground animate-pulse">Loading preferences...</span></div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background">
      <header className="flex flex-col gap-2 pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          What do you want to work on?
        </h1>
        <p className="text-muted-foreground">
          Select your tech stack and interests to receive personalized open-source issue recommendations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Technologies */}
        <section className="flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {TECHNOLOGIES.map(tech => (
              <button
                key={tech}
                onClick={() => toggleArrayItem('technologies', tech)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  preferences.technologies.includes(tech)
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </section>

        {/* Interests */}
        <section className="flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => toggleArrayItem('interests', interest)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  preferences.interests.includes(interest)
                    ? 'bg-success/20 text-success border border-success/30 shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Issue Types */}
        <section className="flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Preferred Issue Types</h2>
          <div className="flex flex-col gap-3">
            {ISSUE_TYPES.map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    className="peer appearance-none w-5 h-5 border-2 border-border rounded-sm checked:bg-accent checked:border-accent transition-colors"
                    checked={preferences.issue_types.includes(type)}
                    onChange={() => toggleArrayItem('issue_types', type)}
                  />
                  <CheckCircle2 className="absolute w-4 h-4 text-accent-foreground opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <span className="text-foreground group-hover:text-accent transition-colors">{type}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Target Difficulty</h2>
          <div className="flex flex-col gap-3">
            {DIFFICULTIES.map(diff => (
              <label key={diff} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="radio"
                    name="difficulty"
                    className="peer appearance-none w-5 h-5 border-2 border-border rounded-full checked:border-accent transition-colors"
                    checked={preferences.difficulty === diff}
                    onChange={() => setPreferences(prev => ({ ...prev, difficulty: diff }))}
                  />
                  <div className="absolute w-2.5 h-2.5 bg-accent rounded-full opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <span className="text-foreground group-hover:text-accent transition-colors">{diff}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex-1">
          {message && (
            <div
              className={`flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${message.type === 'success' ? 'text-success' : 'text-danger'}`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-70 px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Starting...
            </span>
          ) : (
            <>
              Proceed with Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
