import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useShopConfig from '../../hooks/useShopConfig';

export default function ShopGuard({ children }) {
  const { shop, loading, refetchShop } = useShopConfig();
  const location = useLocation();

  // Local state to prevent redirect loops during async refetch
  const [redirectReady, setRedirectReady] = useState(false);

  // Small delay to let refetchShop from onboarding settle
  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirectReady(true);
    }, 300); // 300ms buffer – enough for state to update

    return () => clearTimeout(timer);
  }, []);

  // Optional: auto-refetch once on mount (helps if token was updated)
  useEffect(() => {
    if (!loading && shop === null) {
      refetchShop().catch(err => console.error("Auto-refetch failed:", err));
    }
  }, [loading, shop, refetchShop]);

  if (loading) {
    return <div>Loading shop configuration...</div>;
  }

  // Wait for redirect-ready buffer to avoid premature redirect
  if (!redirectReady) {
    return <div>Verifying shop status...</div>;
  }

  // No shop detected → go to setup (except if already there)
  if (shop === null && location.pathname !== '/setup-shop') {
    console.log("ShopGuard: No shop → redirecting to /setup-shop");
    return <Navigate to="/setup-shop" replace />;
  }

  // Has shop but still on setup page → go to dashboard
  if (shop !== null && location.pathname === '/setup-shop') {
    console.log("ShopGuard: Shop exists → redirecting to dashboard");
    return <Navigate to="/" replace />;
  }

  // All good → render children
  return children;
}