/**
 * @fileoverview OpenPath Component
 * @module Frontend/Main
 * @description Entry point for the React application. Mounts the root component and injects routing.
 * @dependencies [react, react-dom, react-router-dom]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
