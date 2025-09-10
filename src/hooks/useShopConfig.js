import { useEffect, useState } from 'react';
import { fetchShop } from '../services/api';

export default function useShopConfig() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShop()
      .then(res => setShop(res.data))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  return { shop, loading };
}