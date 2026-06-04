import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

// Synchronous render-time redirect — no useEffect, no timing races.
// If the user is already authenticated, send them to /dashboard immediately.
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
