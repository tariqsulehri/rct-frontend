import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    // PublicRoute redirects to /dashboard if already authenticated
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/dashboard',
    // ProtectedRoute redirects to /login if not authenticated
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
