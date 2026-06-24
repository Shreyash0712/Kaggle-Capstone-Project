import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ChatInterface } from './components/chat/ChatInterface';
import { AuthModal } from './components/auth/AuthModal';
import { OAuthCallback } from './pages/OAuthCallback';
import { useAuth } from './context/AuthContext';
import './index.css';

const AppContent: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/chat/:sessionId" element={<ChatInterface />} />
          <Route path="/auth/callback/google" element={<OAuthCallback />} />
          <Route path="/auth/callback/github" element={<OAuthCallback />} />
        </Routes>
      </AppLayout>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {!user && (
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="fixed top-4 right-16 z-50 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
        >
          Login
        </button>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
