import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import Sidebar from '../components/layout/Sidebar';

function PrivateRoute({ children }) {
  const auth = isAuthenticated();

  useEffect(() => {
    if (!auth) {
      window.location.href = '/login'; // Force redirect if token becomes invalid
    }
  }, [auth]);

  return auth ? <Sidebar>{children}</Sidebar> : <Navigate to="/login" />;
}

export default PrivateRoute;
