import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      if (isForgotPassword) {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to request password reset');
        }
        setSuccessMessage('If that email is registered, a password reset link has been sent.');
      } else if (isLogin) {
        // FastAPI OAuth2PasswordRequestForm uses form-urlencoded
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        
        if (!loginRes.ok) throw new Error('Invalid credentials');
        const loginData = await loginRes.json();
        
        // Fetch user details using the token
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        if (!meRes.ok) throw new Error('Failed to fetch user details');
        const userData = await meRes.json();
        
        login(loginData.access_token, userData);
        onClose();
      } else {
        const regRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!regRes.ok) {
            const err = await regRes.json();
            let errorMsg = 'Registration failed';
            if (typeof err.detail === 'string') {
                errorMsg = err.detail;
            } else if (Array.isArray(err.detail)) {
                errorMsg = err.detail.map((e: any) => e.msg).join(', ');
            }
            throw new Error(errorMsg);
        }
        
        // After registration, tell user to verify or automatically log them in
        // The backend sets is_verified=False and sends an email. Let's just show a message.
        setSuccessMessage('Registration successful! Please check your email to verify your account.');
        setIsLogin(true); // switch to login mode
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google/login`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Google login failed', err);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/github/login`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Github login failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-primary)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome back' : 'Create an account')}
          </h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 text-sm text-green-600 bg-green-100 rounded-lg">
              {successMessage}
            </div>
          )}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                placeholder="you@example.com"
                required
              />
            </div>
            
            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMessage(null); }}
                      className="text-xs text-[var(--text-primary)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--text-primary)] text-[var(--bg-primary)] py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {isLoading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign in with Email' : 'Sign up with Email'))}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--bg-primary)] text-[var(--text-secondary)]">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 10 00 12 2z" />
              </svg>
              GitHub
            </button>
          </div>

          {!isForgotPassword ? (
            <div className="text-center text-sm text-[var(--text-secondary)]">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-[var(--text-primary)] hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-[var(--text-secondary)]">
              Remember your password?{' '}
              <button
                onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(null); setSuccessMessage(null); }}
                className="font-medium text-[var(--text-primary)] hover:underline"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
