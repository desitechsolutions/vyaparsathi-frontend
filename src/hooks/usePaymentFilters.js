import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { fetchPaymentsFiltered } from '../services/api';

/**
 * Debounce window between a filter change and the actual API request.
 * 500 ms keeps rapid edits (typing a transaction ID) from spamming the server.
 */
const DEBOUNCE_MS = 500;

/** localStorage key shared with AdvancedPaymentFilter for persistence. */
const LS_KEY = 'payment_filters_v1';

export const DEFAULT_FILTERS = {
  startDate: null,
  endDate:   null,
  methods:   [],   // e.g. ['CASH', 'UPI']
  status:    [],   // e.g. ['PAID', 'PENDING']
  search:    '',   // transaction-ID prefix search
};

/**
 * Read persisted filter state from localStorage.
 * Falls back to DEFAULT_FILTERS on any parse failure.
 */
function loadPersistedFilters() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    return {
      startDate: parsed.startDate ?? null,
      endDate:   parsed.endDate   ?? null,
      methods:   Array.isArray(parsed.methods) ? parsed.methods : [],
      status:    Array.isArray(parsed.status)  ? parsed.status  : [],
      search:    typeof parsed.search === 'string' ? parsed.search : '',
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

/**
 * usePaymentFilters
 *
 * Manages server-side payment filtering and pagination for a given customer.
 * Debounces API calls 500 ms after the last filter/page change.
 *
 * @param {string|number|null} customerId - The customer whose payments to load.
 *
 * @returns {{
 *   payments:           object[],
 *   filters:            object,
 *   setFilters:         (newFilters: object) => void,
 *   page:               number,
 *   setPage:            (page: number) => void,
 *   rowsPerPage:        number,
 *   loading:            boolean,
 *   total:              number,
 *   refetch:            () => void,
 *   snackbar:           { open: boolean, message: string, severity: string },
 *   handleSnackbarClose: (event, reason) => void,
 * }}
 */
export function usePaymentFilters(customerId) {
  const [payments,    setPayments]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [page,        setPageRaw]     = useState(0);
  const [filters,     setFiltersRaw]  = useState(loadPersistedFilters);
  const [snackbar,    setSnackbar]    = useState({ open: false, message: '', severity: 'info' });

  /** Fixed page size — kept in hook state so callers can read it. */
  const rowsPerPage = 20;

  /** Ref that holds the active debounce timer so we can cancel it on re-render. */
  const debounceTimer = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const showSnackbar = useCallback((message, severity = 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // ── Core fetch ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (signal) => {
    setLoading(true);
    try {
      const resp = await fetchPaymentsFiltered(customerId, filters, page, rowsPerPage, signal);
      setPayments(resp.content ?? []);
      setTotal(resp.totalElements ?? 0);
    } catch (err) {
      if (axios.isCancel(err)) return; // navigated away — discard silently
      console.error('[usePaymentFilters] fetch error:', err);
      showSnackbar(
        err?.response?.data?.message || 'Failed to load payments. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, filters, page, rowsPerPage, showSnackbar]);

  // ── Debounced effect ──────────────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchData(controller.signal);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimer.current);
      controller.abort();
    };
  }, [fetchData]);

  // ── Public API ────────────────────────────────────────────────────────────

  /** Replace filters and reset to page 0. */
  const setFilters = useCallback((newFilters) => {
    setPageRaw(0);
    setFiltersRaw(newFilters);
  }, []);

  /** Navigate to a specific page without touching filters. */
  const setPage = useCallback((newPage) => {
    setPageRaw(newPage);
  }, []);

  /** Force an immediate re-fetch (bypasses the debounce). */
  const refetch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const controller = new AbortController();
    fetchData(controller.signal);
  }, [fetchData]);

  return {
    payments,
    filters,
    setFilters,
    page,
    setPage,
    rowsPerPage,
    loading,
    total,
    refetch,
    snackbar,
    handleSnackbarClose,
  };
}
