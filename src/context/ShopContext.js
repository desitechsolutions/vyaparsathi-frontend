import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchShop, fetchIndustryConfig, fetchCustomAttributes } from '../services/api';

const ShopContext = createContext(null);

const EMPTY_INDUSTRY_CONFIG = { item: [], variant: [], labels: {} };

const emptyContext = {
  shop: null,
  shopLoading: true,
  industryType: null,
  industryConfig: EMPTY_INDUSTRY_CONFIG,
  industryConfigLoading: false,
  customAttributes: [],
  customAttributesLoading: false,
  refreshCustomAttributes: async () => {},
  isJewellery: false,
  isElectronics: false,
  isAutomobile: false,
  isClothing: false,
  isHardware: false,
  isStationery: false,
  isGrocery: false,
  isFootwear: false,
  isFurniture: false,
  isGeneral: false,
};

export const ShopProvider = ({ children }) => {
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [industryConfig, setIndustryConfig] = useState(EMPTY_INDUSTRY_CONFIG);
  const [industryConfigLoading, setIndustryConfigLoading] = useState(false);
  const [customAttributes, setCustomAttributes] = useState([]);
  const [customAttributesLoading, setCustomAttributesLoading] = useState(false);

  useEffect(() => {
    fetchShop()
      .then((res) => setShop(res?.data || null))
      .catch(() => setShop(null))
      .finally(() => setShopLoading(false));
  }, []);

  const industryType = shop?.industryType || null;

  useEffect(() => {
    if (!industryType) {
      setIndustryConfig(EMPTY_INDUSTRY_CONFIG);
      return;
    }
    let cancelled = false;
    setIndustryConfigLoading(true);
    fetchIndustryConfig(industryType)
      .then((res) => {
        if (!cancelled) setIndustryConfig(res?.data || EMPTY_INDUSTRY_CONFIG);
      })
      .catch(() => {
        if (!cancelled) setIndustryConfig(EMPTY_INDUSTRY_CONFIG);
      })
      .finally(() => {
        if (!cancelled) setIndustryConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [industryType]);

  const refreshCustomAttributes = useCallback(async () => {
    if (!shop?.id) {
      setCustomAttributes([]);
      return;
    }
    setCustomAttributesLoading(true);
    try {
      const res = await fetchCustomAttributes();
      setCustomAttributes(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setCustomAttributes([]);
    } finally {
      setCustomAttributesLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    refreshCustomAttributes();
  }, [refreshCustomAttributes]);

  const value = {
    shop,
    shopLoading,
    industryType,
    industryConfig,
    industryConfigLoading,
    customAttributes,
    customAttributesLoading,
    refreshCustomAttributes,
    isJewellery:  industryType === 'JEWELLERY',
    isElectronics: industryType === 'ELECTRONICS',
    isAutomobile: industryType === 'AUTOMOBILE',
    isClothing:   industryType === 'CLOTHING',
    isHardware:   industryType === 'HARDWARE',
    isStationery: industryType === 'STATIONERY',
    isGrocery:    industryType === 'GROCERY',
    isFootwear:   industryType === 'FOOTWEAR',
    isFurniture:  industryType === 'FURNITURE',
    isGeneral:    industryType === 'GENERAL' || !industryType,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined || context === null) {
    return emptyContext;
  }
  return context;
};
