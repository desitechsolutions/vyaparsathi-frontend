import { useState, useEffect, useCallback } from 'react';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder,
  getSuppliers,
} from '../services/api'; // Assuming your api service file path

export const usePurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [search, setSearch] = useState({ poNumber: '', supplierId: '', status: '' });

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ordersData, suppliersData] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
      ]);

      const suppliers = suppliersData.data || suppliersData || [];
      setOrders(ordersData || []);
      setAllSuppliers(Array.isArray(suppliers) ? suppliers : []);

      if (!ordersData || ordersData.length === 0) {
        setSnackbar({ open: true, message: 'No purchase orders found.', severity: 'info' });
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setError('Failed to fetch purchase order data.');
      setSnackbar({ open: true, message: 'Error fetching data. Please try again.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
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

  const handleDelete = async (poId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deletePurchaseOrder(poId);
        showSnackbar('Purchase order deleted successfully.');
        setOrders((prev) => prev.filter((po) => po.id !== poId));
      } catch (err) {
        console.error('Failed to delete purchase order:', err);
        showSnackbar('Failed to delete purchase order.', 'error');
      }
    }
  };

  const handleReceive = async (poId) => {
    try {
      await receivePurchaseOrder(poId);
      showSnackbar('Purchase order marked as received.');
      await fetchAllData(); // Refresh to show status update
    } catch (err) {
      console.error('Failed to update purchase order status:', err);
      showSnackbar('Failed to mark order as received.', 'error');
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
    handleDelete,
    handleReceive,
    handleCreateOrUpdate,
    handleSnackbarClose,
    refreshData: fetchAllData,
  };
};