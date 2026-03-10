import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchShop } from '../services/api';

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 ShopProvider: Initiating API call to fetchShop...");
    
    fetchShop()
      .then(res => {
        console.log("✅ API Raw Response:", res);
        console.log("📦 Data inside response:", res?.data);
        
        // This is the specific field check
        if (res?.data) {
          console.log("🏭 Detected Industry Type:", res.data.industryType);
        } else {
          console.warn("⚠️ API returned success but data was empty.");
        }
        
        setShop(res?.data || null);
      })
      .catch((err) => {
        console.error("❌ API Fetch Error:", err);
        setShop(null);
      })
      .finally(() => {
        setShopLoading(false);
      });
  }, []);

  // Calculate derived state
  const industryType = shop?.industryType || null;
  const isPharmacy   = industryType === 'PHARMACY';
  const isJewellery  = industryType === 'JEWELLERY';
  const isElectronics = industryType === 'ELECTRONICS';
  const isAutomobile = industryType === 'AUTOMOBILE';
  const isClothing   = industryType === 'CLOTHING';
  const isHardware   = industryType === 'HARDWARE';
  const isStationery = industryType === 'STATIONERY';

  // Log the state of variables on every render
  console.log("🔄 ShopProvider Render:", { 
    shopExists: !!shop, 
    industryType, 
    isPharmacy, 
    shopLoading 
  });

  return (
    <ShopContext.Provider value={{
      shop, shopLoading,
      industryType,
      isPharmacy,
      isJewellery,
      isElectronics,
      isAutomobile,
      isClothing,
      isHardware,
      isStationery,
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined || context === null) {
    console.error("🚫 useShop was used outside of a ShopProvider! Check your App.js structure.");
    return {
      shop: null, shopLoading: true,
      industryType: null,
      isPharmacy: false, isJewellery: false, isElectronics: false,
      isAutomobile: false, isClothing: false, isHardware: false, isStationery: false,
    };
  }
  return context;
};