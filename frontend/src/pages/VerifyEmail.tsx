import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Verification failed');
        }
        return res.json();
      })
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        setTimeout(() => navigate('/'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      });
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full pt-20 px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Email Verification</h2>
        {status === 'loading' && <p className="text-[var(--text-secondary)]">Verifying your email...</p>}
        {status === 'success' && (
          <div className="text-green-500">
            <p className="mb-4">{message}</p>
            <p className="text-sm text-[var(--text-secondary)]">Redirecting to home...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="text-red-500">
            <p className="mb-4">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-sm"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
