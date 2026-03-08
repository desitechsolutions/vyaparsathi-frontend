import React from 'react';
import { AuthProvider } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { AlertProvider } from './AlertContext';
import { ShopProvider } from './ShopContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ShopProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </ShopProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export default AppProvider;