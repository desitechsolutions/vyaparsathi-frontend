import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchSubscriptionStatus, submitPaymentUtr, startTrial } from '../services/api';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-toastify'; // Added for the success notification

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuthContext(); 
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const prevStatusRef = useRef(null); // To track status changes for the toast

    const refreshStatus = useCallback(async (showLoading = true) => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        if (showLoading) setLoading(true);
        setError(null);
        try {
            const data = await fetchSubscriptionStatus();
            
            // Success Toast Logic: Check if status just changed from PENDING to ACTIVE
            if (prevStatusRef.current === 'PENDING' && data?.status === 'ACTIVE') {
                toast.success('Payment Verified! Premium features are now unlocked.', {
                    position: "top-right",
                    autoClose: 5000,
                });
            }
            
            prevStatusRef.current = data?.status;
            setSubscription(data);
        } catch (err) {
            console.error("Subscription sync failed:", err);
            setError("Could not update subscription status.");
            setSubscription(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    // AUTO-POLLING: Checks status every 30 seconds ONLY when status is PENDING
    useEffect(() => {
        let interval;
        if (subscription?.status === 'PENDING') {
            interval = setInterval(() => {
                refreshStatus(false); // Silent refresh
            }, 30000); 
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [subscription?.status, refreshStatus]);

    const plans = useMemo(() => [
        { 
            id: 'p1', name: 'Starter', monthlyPrice: 499, tier: 'STARTER', 
            features: ['Up to 50 Products', 'Standard Invoices'] 
        },
        { 
            id: 'p2', name: 'Business Pro', monthlyPrice: 1299, tier: 'PRO', 
            features: ['Unlimited Products', 'Advanced GST Reports', 'Bulk Data Export'] 
        },
        { 
            id: 'p3', name: 'Enterprise', monthlyPrice: 1499, tier: 'ENTERPRISE', 
            features: ['Multi-shop Locations', 'Audit Logs', 'Custom API Access'] 
        }
    ], []);

    // Getters
    const isPremium = useCallback(() => {
        return subscription?.premium === true; 
    }, [subscription]);
    
    const getDaysRemaining = useCallback(() => subscription?.daysRemaining || 0, [subscription]);
    const getStatus = useCallback(() => {
        return subscription?.status || 'FREE'; 
    }, [subscription]);

    const verifyPayment = async (utrNumber, planTier) => {
        try {
            const plan = plans.find(p => p.tier === planTier);
            const amount = plan ? Math.round(plan.monthlyPrice * 1.18) : 0;

            const response = await submitPaymentUtr({
                utrNumber,
                planTier,
                amountPaid: amount
            });
            await refreshStatus(false); 
            return response;
        } catch (err) {
            throw err; 
        }
    };

    const initiateTrial = async () => {
        try {
            await startTrial();
            await refreshStatus(false);
        } catch (err) {
            console.error("Trial activation failed", err);
            throw err;
        }
    };

    const value = {
        subscription,
        loading,
        error,
        plans,
        isPremium,
        getDaysRemaining,
        getStatus,
        verifyPayment,
        initiateTrial,
        refreshStatus,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);