import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { fetchLowStockAlerts } from '../services/api';

const AlertContext = createContext();

export const useAlerts = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAlerts = useCallback(async () => {
    try {
      const response = await fetchLowStockAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch low stock alerts:", error);
      setAlerts([]);
    } finally {
      // Only set loading to false on the initial load
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]); // Keep isLoading dependency for the initial load logic

  useEffect(() => {
    getAlerts(); // Fetch on initial load

    const intervalId = setInterval(getAlerts, 300000); // Re-fetch every 5 minutes

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [getAlerts]);

  // FIX: Wrap the function in useCallback to stabilize its reference
  const manuallySetAlerts = useCallback((newAlerts) => {
    setAlerts(newAlerts);
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