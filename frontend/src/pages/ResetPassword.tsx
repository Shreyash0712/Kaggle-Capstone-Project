import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/client';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">
            Enter your new password below.
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <div>
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400">Password Reset Successfully</h3>
              <p className="text-[var(--text-secondary)] mt-1">Redirecting you to the homepage...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="••••••••"
                  required
                  disabled={!token || isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="••••••••"
                  required
                  disabled={!token || isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!token || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--text-primary)] text-[var(--bg-primary)] py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-6"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => navigate('/')}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
