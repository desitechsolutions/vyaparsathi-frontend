import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { fetchLowStockAlerts } from '../services/api';
import { useAuthContext } from './AuthContext';
import { getValidToken } from '../utils/authStorage';

const AlertContext = createContext();

export const useAlerts = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAlerts = useCallback(async () => {
    const token = getValidToken();
    if (!user || !user.shopId || !token) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchLowStockAlerts();
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch low stock alerts:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const token = getValidToken();
    if (!user || !user.shopId || !token) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    getAlerts(); // Fetch on login or shop change

    const intervalId = setInterval(getAlerts, 300000); // Re-fetch every 5 minutes only while logged in

    return () => clearInterval(intervalId); // Cleanup on logout or unmount
  }, [user, getAlerts]);

  // FIX: Wrap the function in useCallback to stabilize its reference
  const manuallySetAlerts = useCallback((newAlerts) => {
    setAlerts(Array.isArray(newAlerts) ? newAlerts : []);
  }, []); // setAlerts is stable, so the dependency array is empty

  const value = {
    alerts,
    alertCount: alerts.length,
    criticalCount: alerts.filter(a => a.alertLevel === 'CRITICAL').length, // Corrected property name from your DTO
    isLoading,
    refreshAlerts: getAlerts,
    manuallySetAlerts,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};