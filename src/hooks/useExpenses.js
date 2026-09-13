import { useState, useCallback } from 'react';
import {
  createExpenseEnterprise,
  getExpensesEnterprise,
  updateExpenseEnterprise,
  deleteExpenseEnterprise,
} from '../services/api';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, size: 25, total: 0 });

  const fetchExpenses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExpensesEnterprise(params);
      setExpenses(response.content || response);
      if (response.totalElements !== undefined) {
        setPagination({
          page: response.number || 0,
          size: response.size || 25,
          total: response.totalElements || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createExpenseEnterprise(data);
      setExpenses((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message || 'Failed to create expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateExpenseEnterprise(id, data);
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === id ? updated : exp))
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteExpenseEnterprise(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    expenses,
    loading,
    error,
    pagination,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
