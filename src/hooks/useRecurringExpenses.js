import { useState, useCallback } from 'react';
import { getExpensesEnterprise, createExpenseEnterprise } from '../services/api';

export const useRecurringExpenses = () => {
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecurringTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Filter for expenses where isRecurring=true
      const response = await getExpensesEnterprise({
        isRecurring: true,
        size: 100,
      });
      setTemplates(response.content || response);
    } catch (err) {
      setError(err.message || 'Failed to fetch recurring templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecurringInstances = useCallback(async (recurringId) => {
    setLoading(true);
    setError(null);
    try {
      // Filter for expenses where recurringExpenseId matches
      const response = await getExpensesEnterprise({
        recurringExpenseId: recurringId,
        size: 100,
      });
      setInstances(response.content || response);
    } catch (err) {
      setError(err.message || 'Failed to fetch recurring instances');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecurringExpense = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createExpenseEnterprise({
        ...data,
        isRecurring: true,
      });
      setTemplates((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message || 'Failed to create recurring expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInstanceFromTemplate = useCallback(async (templateId, data) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createExpenseEnterprise({
        ...data,
        recurringExpenseId: templateId,
      });
      setInstances((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message || 'Failed to create recurring instance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    templates,
    instances,
    loading,
    error,
    fetchRecurringTemplates,
    fetchRecurringInstances,
    createRecurringExpense,
    createInstanceFromTemplate,
  };
};
