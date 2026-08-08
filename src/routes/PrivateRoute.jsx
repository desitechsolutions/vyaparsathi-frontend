import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading: authLoading } = useAuthContext();
  const location = useLocation();

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    const redirectPath = location.pathname + location.search;
    if (location.pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', redirectPath);
    }
    return <Navigate to={`/login?expired=1&redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  return children;
}

export default PrivateRoute;