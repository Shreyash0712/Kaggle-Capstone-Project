/**
 * @fileoverview OpenPath Component
 * @module Frontend/Pages/Login
 * @description The login landing page with a minimalist, premium aesthetic.
 * @dependencies [react, framer-motion, lucide-react, ../../contexts/AuthContext]
 * @stateConsumed N/A
 * @stateProduced N/A
 */
import { GitBranch, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, login, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-200px h-200px bg-primary/10 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
      </div>

      <div 
        className="z-10 w-full max-w-md p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700"
      >
        <div className="flex flex-col items-center text-center space-y-8">
          <div 
            className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in duration-500 delay-150"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              OpenPath
            </h1>
            <p className="text-foreground/60 text-lg">
              Your AI-powered open source contribution mentor.
            </p>
          </div>

          <button
            onClick={login}
            className="w-full group relative flex items-center justify-center gap-3 bg-foreground text-background py-4 px-6 rounded-xl font-medium text-lg transition-all hover:bg-foreground/90 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-white/20 to-primary/0 translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <GitBranch className="w-6 h-6" />
            <span>Continue with GitHub</span>
            <ArrowRight className="w-5 h-5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
