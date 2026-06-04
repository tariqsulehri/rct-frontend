import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'ADMIN' | 'MANAGER' | 'ENGINEER'>;
}

// By the time this renders, App.tsx's HydrationGate has already confirmed that
// Zustand has finished reading localStorage — no isLoading/isHydrating guard needed.
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isAuthenticated, accessToken } = useAuthStore();

  if (!isAuthenticated || !user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'rgb(var(--bg))' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--text-1))' }}>Access Denied</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--text-2))' }}>
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
