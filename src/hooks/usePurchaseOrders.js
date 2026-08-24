import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getSuppliers,
  submitPurchaseOrder,
  cancelPurchaseOrder,
  sendPurchaseOrder,
  markReceivedPurchaseOrder,
} from '../services/api';

export const usePurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [search, setSearch] = useState({ poNumber: '', supplierId: '', status: '' });

  // Dialog for confirming delete
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    poId: null,
  });

  const fetchAllData = useCallback(async (signal) => {
    setIsLoading(true);
    setError('');
    try {
      const [ordersData, suppliersData] = await Promise.all([
        getPurchaseOrders(signal),
        getSuppliers(signal),
      ]);

      const suppliers = suppliersData.data || suppliersData || [];
      setOrders(ordersData || []);
      setAllSuppliers(Array.isArray(suppliers) ? suppliers : []);

      if (!ordersData || ordersData.length === 0) {
        setSnackbar({ open: true, message: 'No purchase orders found.', severity: 'info' });
      }
    } catch (err) {
      if (axios.isCancel(err)) return; // component unmounted — discard silently
      console.error("Failed to fetch initial data:", err);
      setError('Failed to fetch purchase order data.');
      setSnackbar({ open: true, message: 'Error fetching data. Please try again.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(controller.signal);
    return () => controller.abort();
  }, [fetchAllData]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Instead of window.confirm, open dialog and return a promise
  const handleDelete = (poId) => {
    setDeleteDialog({ open: true, poId });
  };

  const confirmDelete = async () => {
    const poId = deleteDialog.poId;
    setDeleteDialog({ open: false, poId: null });
    if (!poId) return;
    try {
      await deletePurchaseOrder(poId);
      showSnackbar('Purchase order deleted successfully.');
      setOrders((prev) => prev.filter((po) => po.id !== poId));
    } catch (err) {
      console.error('Failed to delete purchase order:', err);
      showSnackbar('Failed to delete purchase order.', 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, poId: null });
  };

  const handleCreateOrUpdate = async (mode, poData, poId = null) => {
    try {
      if (mode === 'create') {
        await createPurchaseOrder(poData);
        showSnackbar('Purchase order created successfully.');
      } else {
        await updatePurchaseOrder(poId, poData);
        showSnackbar('Purchase order updated successfully.');
      }
      await fetchAllData();
      return { success: true };
    } catch (err) {
      console.error(`Failed to ${mode} purchase order:`, err);
      const errorMessage = err?.response?.data?.message || `Failed to ${mode} purchase order.`;
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  // Add this function to handle PO submit
  const handleSubmitPO = async (poId) => {
    try {
      await submitPurchaseOrder(poId);
      showSnackbar('Purchase order submitted successfully.', 'success');
      await fetchAllData();
      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to submit purchase order.';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  // V81 lifecycle actions — cancel requires a reason (BE enforces @NotBlank).
  const handleCancelPO = async (poId, reason) => {
    try {
      await cancelPurchaseOrder(poId, reason);
      showSnackbar('Purchase order cancelled.', 'success');
      await fetchAllData();
      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to cancel purchase order.';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  const handleSendPO = async (poId) => {
    try {
      await sendPurchaseOrder(poId);
      showSnackbar('Purchase order marked as sent to supplier.', 'success');
      await fetchAllData();
      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to mark PO as sent.';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  const handleMarkReceived = async (poId) => {
    try {
      await markReceivedPurchaseOrder(poId);
      showSnackbar('Purchase order marked as fully received.', 'success');
      await fetchAllData();
      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to mark PO as received.';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  const filteredOrders = orders.filter((po) => {
    const poNumMatch = search.poNumber ? po.poNumber.toLowerCase().includes(search.poNumber.toLowerCase()) : true;
    const suppMatch = search.supplierId ? String(po.supplierId) === String(search.supplierId) : true;
    const statusMatch = search.status ? po.status === search.status : true;
    return poNumMatch && suppMatch && statusMatch;
  });

  return {
    orders,
    allSuppliers,
    isLoading,
    error,
    snackbar,
    search,
    filteredOrders,
    setSearch,
    handleDelete,       // Use this to open the dialog
    confirmDelete,      // Call this to actually delete
    cancelDelete,       // Call this to cancel dialog
    deleteDialog,       // Expose dialog state to UI
    handleCreateOrUpdate,
    handleSubmitPO,     // <-- expose to modal
    handleCancelPO,
    handleSendPO,
    handleMarkReceived,
    handleSnackbarClose,
    refreshData: fetchAllData,
  };
};