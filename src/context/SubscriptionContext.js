import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchSubscriptionStatus, submitPaymentUtr, startTrial } from '../services/api';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-toastify';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuthContext(); 
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Use a ref to track if it's the very first load for this user
    const isInitialLoad = useRef(true);
    const prevStatusRef = useRef(null);

    const refreshStatus = useCallback(async (showLoading = true) => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            isInitialLoad.current = true; // Reset when user logs out
            prevStatusRef.current = null;
            return;
        }

        if (showLoading) setLoading(true);
        setError(null);
        try {
            const data = await fetchSubscriptionStatus();
            const currentStatus = data?.status;

            // --- NOTIFICATION LOGIC ---
            // We only show toasts if this is NOT the initial login load
            if (!isInitialLoad.current) {
                
                // 1. Success Toast: PENDING -> ACTIVE (Payment Verified)
                if (prevStatusRef.current === 'PENDING' && currentStatus === 'ACTIVE') {
                    if (!toast.isActive('payment-success')) {
                        toast.success('Payment Verified! Premium features are now unlocked.', {
                            toastId: 'payment-success',
                            position: "top-right",
                            autoClose: 5000,
                        });
                    }
                }
                
                // 2. Success Toast: Detection of status change to TRIAL (Real-time activation)
                // We check if it was explicitly NOT trial before, but was a valid status (not null)
                if (prevStatusRef.current !== 'TRIAL' && currentStatus === 'TRIAL' && prevStatusRef.current !== null) {
                    if (!toast.isActive('trial-activated-toast')) {
                        toast.info('14-Day Free Trial Activated!', { 
                            toastId: 'trial-activated-toast',
                            position: "top-right" 
                        });
                    }
                }
            }
            
            // After the first successful fetch, mark initial load as false
            isInitialLoad.current = false;
            prevStatusRef.current = currentStatus;
            setSubscription(data);
        } catch (err) {
            console.error("Subscription sync failed:", err);
            setError("Could not update subscription status.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    // AUTO-POLLING: Only runs when status is PENDING
    useEffect(() => {
        let interval;
        if (subscription?.status === 'PENDING') {
            interval = setInterval(() => {
                refreshStatus(false); 
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

    const isPremium = useCallback(() => {
        return subscription?.premium === true || subscription?.status === 'TRIAL'; 
    }, [subscription]);
    
    const getDaysRemaining = useCallback(() => {
        return subscription?.daysRemaining ?? 0;
    }, [subscription]);

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
            // We want the notification to show after a manual action, 
            // so we keep isInitialLoad false here.
            await refreshStatus(false); 
            return response;
        } catch (err) {
            throw err; 
        }
    };

    const initiateTrial = async () => {
        try {
            await startTrial();
            // Force isInitialLoad to false so the user gets immediate feedback
            isInitialLoad.current = false;
            await refreshStatus(false);
            
            if (!toast.isActive('manual-trial-success')) {
                toast.success("Trial started successfully!", {
                    toastId: 'manual-trial-success'
                });
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Trial activation failed";
            if (!toast.isActive('trial-error')) {
                toast.error(msg, { toastId: 'trial-error' });
            }
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