import React from 'react';
import { AuthProvider } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { AlertProvider } from './AlertContext';
import { ShopProvider } from './ShopContext';
import { WebSocketProvider } from './WebSocketContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ShopProvider>
          <AlertProvider>
            {/* WebSocketProvider lives inside AuthProvider so it can read
                user.shopId / user.role from the JWT and open a single
                shared STOMP connection for the entire app. */}
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </AlertProvider>
        </ShopProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export default AppProvider;