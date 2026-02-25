import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
    fetchSubscriptionStatus, 
    submitPaymentUtr, 
    startTrial, 
    fetchActivePricingPlans // New dynamic import
} from '../services/api';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-toastify';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuthContext(); 
    const [subscription, setSubscription] = useState(null);
    const [dynamicPlans, setDynamicPlans] = useState([]); // State for DB plans
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const isInitialLoad = useRef(true);
    const prevStatusRef = useRef(null);

    /**
     * Fetches active plan configurations from the database.
     * This ensures prices and features match what the Admin set.
     */
    const loadPlansFromDB = useCallback(async () => {
        try {
            const plansData = await fetchActivePricingPlans();
            setDynamicPlans(plansData);
        } catch (err) {
            console.error("Failed to fetch dynamic pricing plans:", err);
            // Non-blocking error: the app will still function with current sub status
        }
    }, []);

    const refreshStatus = useCallback(async (showLoading = true) => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            isInitialLoad.current = true;
            prevStatusRef.current = null;
            return;
        }

        if (showLoading) setLoading(true);
        setError(null);
        try {
            // Run both status check and plan fetching in parallel
            const [subData] = await Promise.all([
                fetchSubscriptionStatus(),
                loadPlansFromDB()
            ]);

            const currentStatus = subData?.status;

            // --- NOTIFICATION LOGIC ---
            if (!isInitialLoad.current) {
                
                // 1. Payment Verified
                if (prevStatusRef.current === 'PENDING' && currentStatus === 'ACTIVE') {
                    const cycle = subData?.billingCycle === 'YEARLY' ? 'Year' : 'Month';
                    if (!toast.isActive('payment-success')) {
                        toast.success(`Subscription active for the next ${cycle}!`, {
                            toastId: 'payment-success',
                            position: "top-right",
                            autoClose: 5000,
                        });
                    }
                }
                
                // 2. Trial Activated
                if (prevStatusRef.current !== 'TRIAL' && currentStatus === 'TRIAL' && prevStatusRef.current !== null) {
                    if (!toast.isActive('trial-activated-toast')) {
                        toast.info('14-Day Free Trial Activated!', { 
                            toastId: 'trial-activated-toast',
                            position: "top-right" 
                        });
                    }
                }

                // 3. Plan Expired
                if ((prevStatusRef.current === 'ACTIVE' || prevStatusRef.current === 'TRIAL') && currentStatus === 'EXPIRED') {
                    if (!toast.isActive('plan-expired-toast')) {
                        toast.error('Your subscription has expired. Features are now locked.', { 
                            toastId: 'plan-expired-toast',
                            position: "top-right",
                            autoClose: false 
                        });
                    }
                }
            }
            
            isInitialLoad.current = false;
            prevStatusRef.current = currentStatus;
            setSubscription(subData);
        } catch (err) {
            console.error("Subscription sync failed:", err);
            setError("Could not update subscription status.");
        } finally {
            setLoading(false);
        }
    }, [user, loadPlansFromDB]);

    // Derived State Helpers
    const isPremium = useCallback(() => {
        return (subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL') && subscription?.premium === true;
    }, [subscription]);

    const canStartTrial = useCallback(() => {
        return !subscription?.usedTrial && !isPremium();
    }, [subscription, isPremium]);

    const getCurrentCycle = useCallback(() => {
        return subscription?.billingCycle || 'MONTHLY';
    }, [subscription]);

    // Initial Load Effect
    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    // Polling Effect for Pending Payments
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

    // Memoized plans now come from the DB state
    const plans = useMemo(() => dynamicPlans, [dynamicPlans]);

    // --- TIER HELPERS ---
    
    const getTierLevel = (tier) => {
        const levels = { 'FREE': 0, 'STARTER': 1, 'PRO': 2, 'ENTERPRISE': 3 };
        return levels[tier] || 0;
    };

    const hasAccess = useCallback((requiredTier) => {
        if (!requiredTier) return true; 
        
        if (subscription?.status === 'EXPIRED' || subscription?.status === 'PENDING') {
            return false;
        }

        if (subscription?.status === 'TRIAL') {
            return getTierLevel('PRO') >= getTierLevel(requiredTier);
        }

        const currentTier = subscription?.tier || 'FREE';
        return getTierLevel(currentTier) >= getTierLevel(requiredTier);
    }, [subscription]);
    
    const getDaysRemaining = useCallback(() => {
        return subscription?.daysRemaining ?? 0;
    }, [subscription]);

    const getStatus = useCallback(() => {
        return subscription?.status || 'FREE'; 
    }, [subscription]);

    const verifyPayment = async (utrNumber, planTier, billingCycle, finalAmount) => {
        try {
            const response = await submitPaymentUtr({
                utrNumber,
                planTier,
                billingCycle,
                amountPaid: finalAmount
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
        hasAccess,
        getDaysRemaining,
        getStatus,
        canStartTrial,
        getCurrentCycle,
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