import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  fetchCustomersPaged,
  fetchCustomerKpis,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  archiveCustomer,
  toggleCustomerActive,
  bulkToggleCustomerActive,
  bulkDeleteCustomers,
  bulkTagCustomers,
  exportCustomersCsv,
  importCustomersCsv,
} from '../services/api';

/**
 * Milliseconds between the last keystroke in the search box and the
 * actual API hit. Long enough that typing a full name isn't 8 round
 * trips, short enough that filtering feels live.
 */
const SEARCH_DEBOUNCE_MS = 300;

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isKpisLoading, setIsKpisLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Pagination & Sorting state
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    totalElements: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    active: null, // null = all, true = active, false = inactive
    customerType: '', // '' = all, 'INDIVIDUAL', 'BUSINESS', 'GOVERNMENT', 'EXPORT'
    source: '',
    city: '',
    tags: '',
    sortBy: 'name',
    sortDir: 'asc',
  });

  // Debounced copy of `filters.search`. The list-load effect keys off
  // this instead of the raw value so a keystroke doesn't spam the API.
  // Non-search filter fields (active/type/source/city/tags/sortBy) fire
  // immediately — they're changed less frequently and expected to be
  // responsive.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const loadKpis = useCallback(async (signal) => {
    setIsKpisLoading(true);
    try {
      const data = await fetchCustomerKpis(signal);
      setKpis(data);
    } catch (err) {
      if (axios.isCancel(err)) return; // navigated away — discard silently
      console.error('Failed to fetch customer KPIs:', err);
    } finally {
      setIsKpisLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async (signal) => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        size: pagination.size,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      };
      const searchQ = (debouncedSearch || '').trim();
      if (searchQ) params.search = searchQ;
      if (filters.active !== null) params.active = filters.active;
      if (filters.customerType) params.customerType = filters.customerType;
      if (filters.source) params.source = filters.source;
      if (filters.city) params.city = filters.city;
      if (filters.tags) params.tags = filters.tags;

      const resp = await fetchCustomersPaged(params, signal);
      setCustomers(resp.content || []);
      setPagination((prev) => ({
        ...prev,
        totalElements: resp.totalElements || 0,
        totalPages: resp.totalPages || 0,
      }));
    } catch (err) {
      if (axios.isCancel(err)) return; // navigated away — discard silently
      console.error('Failed to load customers:', err);
      setError('Failed to fetch customer records.');
      showSnackbar('Error loading customers. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.size,
    filters.sortBy,
    filters.sortDir,
    filters.active,
    filters.customerType,
    filters.source,
    filters.city,
    filters.tags,
    // debouncedSearch — the whole point of the debounce is that we
    // want to key on the settled value, not the live one.
    debouncedSearch,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    loadCustomers(controller.signal);
    return () => controller.abort();
  }, [loadCustomers]);

  useEffect(() => {
    const controller = new AbortController();
    loadKpis(controller.signal);
    return () => controller.abort();
  }, [loadKpis]);

  const refreshData = () => {
    loadCustomers();
    loadKpis();
  };

  const handleCreate = async (formData) => {
    try {
      const created = await createCustomer(formData);
      showSnackbar(`Customer '${created.data?.name || formData.name}' created successfully.`);
      refreshData();
      return { success: true, data: created.data || created };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create customer';
      showSnackbar(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const updated = await updateCustomer(id, formData);
      showSnackbar(`Customer updated successfully.`);
      refreshData();
      return { success: true, data: updated.data || updated };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update customer';
      showSnackbar(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      showSnackbar('Customer deleted successfully.');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      refreshData();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete customer';
      showSnackbar(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveCustomer(id);
      showSnackbar('Customer archived (set to inactive).');
      refreshData();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to archive customer';
      showSnackbar(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await toggleCustomerActive(id);
      showSnackbar(`Customer ${res?.active ? 'activated' : 'deactivated'}.`);
      refreshData();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to toggle status';
      showSnackbar(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const handleBulkToggleActive = async (active) => {
    if (!selectedIds.length) return;
    try {
      const resp = await bulkToggleCustomerActive(selectedIds, active);
      showSnackbar(`${resp.updatedCount} customer(s) ${active ? 'activated' : 'deactivated'}.`);
      setSelectedIds([]);
      refreshData();
    } catch (err) {
      showSnackbar('Bulk status update failed.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      const resp = await bulkDeleteCustomers(selectedIds);
      const notes = resp.notes?.length ? ` (${resp.notes.length} archived due to existing records)` : '';
      showSnackbar(`Deleted ${resp.deletedCount} customer(s)${notes}.`);
      setSelectedIds([]);
      refreshData();
    } catch (err) {
      showSnackbar('Bulk delete failed.', 'error');
    }
  };

  /**
   * Append tags (comma-separated string) to all selected customers.
   */
  const handleBulkTag = async (tags) => {
    if (!selectedIds.length || !tags) return;
    try {
      const resp = await bulkTagCustomers(selectedIds, tags);
      showSnackbar(`Tags added to ${resp.updatedCount ?? selectedIds.length} customer(s).`);
      setSelectedIds([]);
      refreshData();
    } catch (err) {
      showSnackbar('Failed to apply tags.', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const resp = await exportCustomersCsv();
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('Customer CSV exported successfully.');
    } catch (err) {
      showSnackbar('Failed to export CSV.', 'error');
    }
  };

  const handleImportCsv = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await importCustomersCsv(formData);
      showSnackbar(`Imported ${resp.importedCount} customers. Skipped ${resp.skippedCount}.`);
      refreshData();
      return { success: true, data: resp };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Import failed.';
      showSnackbar(msg, 'error');
      return { success: false, error: msg };
    }
  };

  return {
    customers,
    kpis,
    isLoading,
    isKpisLoading,
    error,
    snackbar,
    pagination,
    setPagination,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    refreshData,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleArchive,
    handleToggleActive,
    handleBulkToggleActive,
    handleBulkDelete,
    handleBulkTag,
    handleExportCsv,
    handleImportCsv,
    handleSnackbarClose,
    showSnackbar,
  };
};
