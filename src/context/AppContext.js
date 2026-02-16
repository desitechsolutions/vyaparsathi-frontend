import React from 'react';
import { AuthProvider } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { AlertProvider } from './AlertContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AlertProvider>
          {children}
        </AlertProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export default AppProvider;