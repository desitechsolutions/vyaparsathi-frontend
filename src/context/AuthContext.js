import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (token) => {
    // Implement login logic
    setUser({ token });
  };

  const logout = () => {
    // Implement logout logic
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);