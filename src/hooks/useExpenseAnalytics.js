import { useState, useCallback } from 'react';
import {
  getDashboardMetrics,
  getCategorySpending,
  getReconciliationSummary,
} from '../services/api';

export const useExpenseAnalytics = () => {
  const [metrics, setMetrics] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    status: 'ACTIVE',
  });
  const [categorySpending, setCategorySpending] = useState(null);
  const [reconciliationSummary, setReconciliationSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardMetrics();
      const data = response?.data || response || {};
      setMetrics(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorySpending = useCallback(async (categoryId, startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCategorySpending(categoryId, startDate, endDate);
      const data = response?.data || response || [];
      setCategorySpending(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch category spending');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReconciliationSummary = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getReconciliationSummary(startDate, endDate);
      const data = response?.data || response || {};
      setReconciliationSummary(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch reconciliation summary');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metrics,
    categorySpending,
    reconciliationSummary,
    loading,
    error,
    fetchDashboardMetrics,
    fetchCategorySpending,
    fetchReconciliationSummary,
  };
};
