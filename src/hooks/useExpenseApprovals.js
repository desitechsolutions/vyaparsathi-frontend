import { useState, useCallback } from 'react';
import {
  getPendingApprovals,
  getPendingApprovalsCount,
  approveExpense,
  rejectExpense,
  escalateExpense,
  getApprovalTimeline,
} from '../services/api';

export const useExpenseApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPendingApprovals = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingApprovals(params);
      setApprovals(response.content || response);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await getPendingApprovalsCount();
      const count = response?.data || response || 0;
      setPendingCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.error('Failed to fetch pending count:', err);
    }
  }, []);

  const approve = useCallback(async (expenseId, comment) => {
    setLoading(true);
    setError(null);
    try {
      await approveExpense(expenseId, { comment });
      setApprovals((prev) =>
        prev.filter((app) => app.expenseId !== expenseId)
      );
      await fetchPendingCount();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to approve expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingCount]);

  const reject = useCallback(async (expenseId, reason) => {
    setLoading(true);
    setError(null);
    try {
      await rejectExpense(expenseId, { reason });
      setApprovals((prev) =>
        prev.filter((app) => app.expenseId !== expenseId)
      );
      await fetchPendingCount();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to reject expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingCount]);

  const escalate = useCallback(async (expenseId, reason) => {
    setLoading(true);
    setError(null);
    try {
      await escalateExpense(expenseId, { reason });
      setApprovals((prev) =>
        prev.filter((app) => app.expenseId !== expenseId)
      );
      await fetchPendingCount();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to escalate expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingCount]);

  const fetchTimeline = useCallback(async (expenseId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovalTimeline(expenseId);
      const data = response?.data || response || [];
      setTimeline(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch approval timeline');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    approvals,
    pendingCount,
    timeline,
    loading,
    error,
    fetchPendingApprovals,
    fetchPendingCount,
    approve,
    reject,
    escalate,
    fetchTimeline,
  };
};
