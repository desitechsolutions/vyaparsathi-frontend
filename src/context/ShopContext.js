import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchShop } from '../services/api';

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  useEffect(() => {
    fetchShop()
      .then(res => setShop(res?.data || null))
      .catch(() => setShop(null))
      .finally(() => setShopLoading(false));
  }, []);

  const isPharmacy = shop?.category === 'PHARMACY';

  return (
    <ShopContext.Provider value={{ shop, shopLoading, isPharmacy }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
