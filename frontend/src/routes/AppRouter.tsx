/**
 * @fileoverview OpenPath Component
 * @module Frontend/Routes
 * @description Defines the main routing structure of the application using react-router-dom.
 * @dependencies [react-router-dom]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import App from '../App';
import Chat from '../pages/Chat/Chat';
import Login from '../pages/Login';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<App />}>
          {/* Redirect root to chat */}
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="dashboard" element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:chatId" element={<Chat />} />
        </Route>
      </Route>
    </Routes>
  );
}
