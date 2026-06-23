import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('No authorization code provided');
      return;
    }

    const provider = location.pathname.includes('google') ? 'google' : 'github';
    
    const handleCallback = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        // The backend expects the code as a query param
        const res = await fetch(`${API_BASE_URL}/auth/${provider}/callback?code=${code}`, {
          method: 'POST'
        });

        if (!res.ok) {
          throw new Error('Failed to exchange token');
        }

        const data = await res.json();
        const token = data.access_token;

        // Fetch user data
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!meRes.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const userData = await meRes.json();
        
        login(token, userData);
        navigate('/', { replace: true });

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'OAuth callback failed');
      }
    };

    handleCallback();
  }, [searchParams, location, login, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Authentication Failed</h2>
        <p className="text-[var(--text-secondary)] mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        Completing Authentication...
      </h2>
      <p className="text-[var(--text-secondary)] mt-2">
        Please wait while we log you in.
      </p>
    </div>
  );
};
