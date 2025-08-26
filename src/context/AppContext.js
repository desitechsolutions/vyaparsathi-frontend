import React from 'react';
import { AuthProvider } from './AuthContext';

// As your application grows, you can import other providers here
// and wrap them around the children.
// For example:
// import { ThemeProvider } from './ThemeContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      {/* <ThemeProvider> */}
        {children}
      {/* </ThemeProvider> */}
    </AuthProvider>
  );
};

export default AppProvider;
