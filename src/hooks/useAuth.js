import { useState, useEffect } from 'react';
import { isAuthenticated } from '../utils/auth';

const useAuth = () => {
  const [isAuth, setIsAuth] = useState(isAuthenticated());

  useEffect(() => {
    // Add listener for auth changes if needed
    setIsAuth(isAuthenticated());
  }, []);

  return { isAuth };
};

export default useAuth;