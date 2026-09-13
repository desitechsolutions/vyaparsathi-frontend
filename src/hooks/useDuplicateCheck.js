/**
 * useDuplicateCheck.js
 *
 * Detects potential duplicate payments before they are recorded.
 * Debounces API calls to avoid hitting the backend on every keystroke.
 * Non-blocking — an API failure produces a soft warning, not a hard error.
 *
 * Input:  { customerId, amount, method, transactionId, date }
 * Output: { isDuplicate, previousPayment, loading, error }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { checkDuplicatePayment } from '../services/api';

const DEBOUNCE_MS = 500;

/**
 * @param {{ customerId: string|number, amount: string|number, method: string, transactionId?: string, date?: string }} params
 * @returns {{
 *   isDuplicate: boolean,
 *   previousPayment: object|null,
 *   loading: boolean,
 *   error: string|null,
 * }}
 */
const useDuplicateCheck = ({
  customerId,
  amount,
  method,
  transactionId,
  date,
} = {}) => {
  const [isDuplicate, setIsDuplicate]     = useState(false);
  const [previousPayment, setPreviousPayment] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  const reset = useCallback(() => {
    setIsDuplicate(false);
    setPreviousPayment(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Cancel any pending debounce and in-flight request from a prior render.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current)    abortRef.current.abort();

    // Skip check when required fields are missing or amount is zero/NaN.
    const parsedAmount = parseFloat(amount);
    if (!customerId || !parsedAmount || parsedAmount <= 0 || !method) {
      reset();
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      const controller  = new AbortController();
      abortRef.current  = controller;

      try {
        const res = await checkDuplicatePayment(
          customerId,
          parsedAmount,
          method,
          transactionId || undefined,
        );

        const payload   = res?.data;
        const duplicate = !!(payload?.duplicate || payload?.isDuplicate);

        setIsDuplicate(duplicate);
        // The backend may return the matched payment under different keys;
        // normalise to whatever is present.
        setPreviousPayment(
          duplicate
            ? (payload?.existingPayment ?? payload?.previousPayment ?? payload ?? null)
            : null,
        );
      } catch (err) {
        // Swallow cancellations — component unmounted or dependencies changed.
        const isCancelled =
          err?.name === 'AbortError'    ||
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED'  ||
          err?.message === 'canceled';

        if (isCancelled) return;

        // Non-blocking: a check failure should warn but never block the user.
        setIsDuplicate(false);
        setPreviousPayment(null);

        const isTimeout = err?.code === 'ECONNABORTED' || err?.response?.status === 408;
        setError(
          isTimeout
            ? 'Duplicate check timed out — please review before submitting.'
            : 'Could not verify for duplicates — please review before submitting.',
        );
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    // Cleanup: cancel the timer and abort the in-flight request.
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current)    abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, amount, method, transactionId, date]);

  return { isDuplicate, previousPayment, loading, error };
};

export default useDuplicateCheck;
