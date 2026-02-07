import { useEffect, useState } from 'react';
import { fetchShop } from '../services/api';

export default function useShopConfig() {
  const [shop, setShop] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const loadShop = async () => {
    setLoading(true);
    try {
      const res = await fetchShop();
      setShop(res.data || null);
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShop(); }, []);

  return { shop, loading, refetchShop: loadShop };
}