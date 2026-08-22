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
  // ── Phase 4 enterprise expansion ─────────────────────────────────
  isBuildingMaterials: false,
  isRestaurant: false,
  isBakery: false,
  isDairy: false,
  isSupermarket: false,
  isCosmetics: false,
  isOptical: false,
  isAgriculture: false,
  isSports: false,
  isBooks: false,
  isToys: false,
  isMobileAccessories: false,
  isHomeAppliances: false,
  isKitchenware: false,
  isTextile: false,
  isPaint: false,
  isSanitaryTiles: false,
  isMedicalEquipment: false,
  isPetSupplies: false,
  isMusicalInstruments: false,
  isFlorist: false,
  isHandicrafts: false,
  isSalonSpa: false,
  isLaundry: false,
  isServices: false,
  isWholesale: false,
  isManufacturing: false,
};

export const ShopProvider = ({ children }) => {
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [industryConfig, setIndustryConfig] = useState(EMPTY_INDUSTRY_CONFIG);
  const [industryConfigLoading, setIndustryConfigLoading] = useState(false);
  const [customAttributes, setCustomAttributes] = useState([]);
  const [customAttributesLoading, setCustomAttributesLoading] = useState(false);

  const refreshShop = useCallback(async () => {
    setShopLoading(true);
    try {
      const res = await fetchShop();
      setShop(res?.data || null);
    } catch {
      setShop(null);
    } finally {
      setShopLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);

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
    refreshShop,
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
    // Phase 4 enterprise expansion
    isBuildingMaterials:  industryType === 'BUILDING_MATERIALS',
    isRestaurant:         industryType === 'RESTAURANT',
    isBakery:             industryType === 'BAKERY',
    isDairy:              industryType === 'DAIRY',
    isSupermarket:        industryType === 'SUPERMARKET',
    isCosmetics:          industryType === 'COSMETICS',
    isOptical:            industryType === 'OPTICAL',
    isAgriculture:        industryType === 'AGRICULTURE',
    isSports:             industryType === 'SPORTS',
    isBooks:              industryType === 'BOOKS',
    isToys:               industryType === 'TOYS',
    isMobileAccessories:  industryType === 'MOBILE_ACCESSORIES',
    isHomeAppliances:     industryType === 'HOME_APPLIANCES',
    isKitchenware:        industryType === 'KITCHENWARE',
    isTextile:            industryType === 'TEXTILE',
    isPaint:              industryType === 'PAINT',
    isSanitaryTiles:      industryType === 'SANITARY_TILES',
    isMedicalEquipment:   industryType === 'MEDICAL_EQUIPMENT',
    isPetSupplies:        industryType === 'PET_SUPPLIES',
    isMusicalInstruments: industryType === 'MUSICAL_INSTRUMENTS',
    isFlorist:            industryType === 'FLORIST',
    isHandicrafts:        industryType === 'HANDICRAFTS',
    isSalonSpa:           industryType === 'SALON_SPA',
    isLaundry:            industryType === 'LAUNDRY',
    isServices:           industryType === 'SERVICES',
    isWholesale:          industryType === 'WHOLESALE',
    isManufacturing:      industryType === 'MANUFACTURING',
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
