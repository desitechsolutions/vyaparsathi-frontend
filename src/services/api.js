import axios from 'axios';
import endpoints from './endpoints';
import { signalApiActivity } from '../utils/auth';
import 'react-toastify/dist/ReactToastify.css';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const API = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Axios request interceptor: attach token, handle activity
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Only signal activity for foreground requests
  if (!config.meta?.background) {
    signalApiActivity();
  }
  return config;
});
// Axios response interceptor: handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest && originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return API(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          window.dispatchEvent(new CustomEvent('appSessionExpired', { detail: { reason: 'No refresh token available.' } }));
          window.location.href = '/login';
          return Promise.reject(new Error("No refresh token available."));
        }

        const res = await axios.post(endpoints.auth.refresh, { refreshToken }, { baseURL: API_BASE_URL});
        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return API(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('appSessionExpired', { detail: { reason: 'Session expired or refresh failed.' } }));
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// --- API exports ---

//Login API
export const login = (payload) =>
  API.post(endpoints.auth.login, payload, { skipAuthRefresh: true });
export const register = async (data) => {
  return API.post(endpoints.auth.register, data);
};

// --- Authentication & Pin Reset ---

// Request a reset link via email
export const forgotPassword = (data) => 
  API.post('/api/auth/forget-password', data, { skipAuthRefresh: true });

// Validate if the token from the email is still valid
export const validateResetToken = (token) => 
  API.post('/api/auth/validate-reset-token', { token });

// Set the new pin/password using the token
export const resetPassword = (data) => 
  API.post('/api/auth/reset-password', data, { skipAuthRefresh: true });
export const forgotPin = (data) => API.post(endpoints.auth.forgotPin, data, { skipAuthRefresh: true });
export const resetPin = (data) => API.post(endpoints.auth.resetPin, data, { skipAuthRefresh: true });
export const changePin = (data) => API.post(endpoints.auth.changePin, data);
// API functions
export const setupShop = (data) => API.post(endpoints.shopOnboard, data);
// Add this to your existing api.js
export const checkShopCode = async (code) => {
  // This calls a simple GET endpoint that returns 200 if available, 409 if taken
  const response = await API.get(`api/shop/check-code?code=${code}`);
  return response.data;
};
export const refreshToken = (refreshToken) =>
  API.post(endpoints.auth.refresh, { refreshToken });

export const searchGlobalData = (query) => {
    return API.get(`/api/v1/search`, {
        params: { q: query }
    });
};
// GET SHOP
export const fetchShop = async () => {
  try {
    const res = await API.get(endpoints.shop);
    
    // If 204 No Content or 404 → treat as no shop (return null data)
    if (res.status === 204 || res.status === 404) {
      return { data: null, status: res.status };
    }

    return res;  // full response with .data = ShopDto

  } catch (err) {
    // Handle errors that mean "no shop"
    if (err.response?.status === 204 || 
        err.response?.status === 404 ||
        err?.response?.data?.message?.includes('No active shop') ||
        err?.response?.data?.message?.includes('No shop context')) {
      return { data: null, status: err.response?.status || 404 };
    }

    // Real errors → re-throw so Promise.allSettled sees rejection
    console.error("fetchShop failed:", err);
    throw err;
  }
};

// --- Purchase Orders ---
export const getPurchaseOrders = () =>
  API.get(endpoints.purchaseOrders).then((r) => r.data);

export const getPurchaseOrderById = (id) =>
  API.get(endpoints.purchaseOrderById(id)).then((r) => r.data);
export const pendingPurchaseOrders  = () =>
  API.get(endpoints.pendingPurchaseOrder).then((r) => r.data);

export const createPurchaseOrder = (data) =>
  API.post(endpoints.purchaseOrders, data).then((r) => r.data);

export const updatePurchaseOrder = (id, data) =>
  API.put(endpoints.purchaseOrderById(id), data).then((r) => r.data);

export const deletePurchaseOrder = (id) =>
  API.delete(endpoints.purchaseOrderById(id)).then((r) => r.data);

export const receivePurchaseOrder = (id) =>
  API.post(endpoints.receivePurchaseOrder(id)).then((r) => r.data);

export const submitPurchaseOrder = (id) =>
  API.post(endpoints.submitPurchaseOrder(id)).then((r) => r.data);

// Supplier APIs
export const getSuppliers = () =>
  API.get(endpoints.suppliers).then((r) => r.data);

export const createSupplier = (data) =>
  API.post(endpoints.suppliers, data).then((r) => r.data);

export const updateSupplier = (id, data) =>
  API.put(endpoints.supplierById(id), data).then((r) => r.data);

export const deleteSupplier = (id) =>
  API.delete(endpoints.supplierById(id)).then((r) => r.data);

export const getSupplierById = (id) =>
  API.get(endpoints.supplierById(id)).then((r) => r.data);

// Item related APIs
export const createItem = (data) => API.post(endpoints.items, data);
export const fetchItems = () => API.get(endpoints.items);
export const getItemById = (id) => API.get(endpoints.getItemById(id));
export const updateItem = (id, data) => API.put(endpoints.updateItem(id), data);
export const fetchCategories = () => API.get(endpoints.fetchCategories);

// Item Variant APIs
export const createItemVariant = (data) => API.post(endpoints.createItemVariant, data)
export const deleteItemVariant = (id) => API.delete(endpoints.deleteItemVariant(id));
export const fetchItemVariants = (params = {}) => {
  return API.get(endpoints.fetchItemVariants, { params });
};
export const fetchItemVariantById = async (id) => {
  const response = await API.get(`/api/item-variants/${id}`);
  return response.data;
};

// Add & Fetch Stock
export const addStock = (data) => API.post(endpoints.stock, data);
export const fetchStock = () => API.get(endpoints.fetchStock);
// --- IMPORTANT: Background polling for low stock alerts ---
export const fetchLowStockAlerts = () =>
  API.get('/api/stock/low-stock-alerts', { meta: { background: true } });
export const adjustStock = (data) => API.post('/api/stock/adjust', data);
export const fetchStockMovements = (variantId) => API.get(`/api/stock/movements/${variantId}`);
export const exportStockReport = (startDate, endDate, format) => 
  API.get(`/api/stock/movements/export`, { params: { startDate, endDate, format }, responseType: 'blob' });

// Customer related APIs
export const fetchCustomers = () => API.get(endpoints.customers);
export const createCustomer = (data) => API.post(endpoints.customers, data);
export const updateCustomer = (id, data) => API.put(`${endpoints.customers}/${id}`, data);
export const fetchCustomer = (id, data) => API.get(`${endpoints.customers}/${id}`, data);
//export const fetchCustomerLedger = (customerId) => API.get(`/api/customers/${customerId}/ledger`);
export const fetchCustomerLedger = (id, params = {}) => {
  // params could include { startDate: '2026-01-01T00:00:00', endDate: '...' }
  return API.get(`/api/customers/${id}/ledger`, { params });
};

//Sales related APIs
export const createSale = (data) => {
  return API.post(endpoints.sales, data);
};
export const draftSale = (data) =>{
  return API.post(endpoints.draftSale, data)
}

export const completeDraftSale = async (id, data) => {
  return await API.put(`api/sales/${id}/complete`, data);
};
// Add to services/api.js
export const processSaleReturn = (saleId, returnData) => 
    API.post(`/api/sales/${saleId}/return`, returnData);

export const cancelSale = (saleId, reason) => 
    API.post(`/api/sales/${saleId}/cancel?reason=${encodeURIComponent(reason)}`, {});

export const fetchSalesWithDue = () => API.get(endpoints.salesWithDue);
export const fetchSalesHistory = () => API.get(endpoints.salesHistory);
export const fetchCustomerDues = (customerId) => API.get(`${endpoints.sales}/${customerId}/dues`);
export const fetchSaleDueById = (id) => API.get(endpoints.saleDueById(id));
export const fetchAllSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.salesByDateRange(from, to));
  }
  return API.get(endpoints.sales);
};
export const getSaleById = (id) => API.get(endpoints.getSaleById(id));
// Delivery related APIs
export const createDelivery = (data) => API.post(endpoints.createDelivery, data);

export const getDelivery = (id) => API.get(endpoints.deliveryById(id));

export const fetchDeliveries = (saleId) => 
  saleId 
    ? API.get(`/api/deliveries?saleId=${saleId}`) 
    : API.get("/api/deliveries");

export const updateDeliveryDetails = (id, data) => 
  API.patch(`/api/deliveries/${id}/details`, data);

export const assignDeliveryPerson = (id, person) => 
  API.patch(`/api/deliveries/${id}/person`, { deliveryPerson: person });

export const updateDeliveryStatus = (id, status, changedBy) => 
  API.patch(`/api/deliveries/${id}/status?status=${status}&changedBy=${changedBy}`);

export const fetchDeliveryHistory = (id) => 
  API.get(`/api/deliveries/${id}/history`);

export const deleteDelivery = (id) => API.delete(`/api/deliveries/${id}`);

// Delivery Person related APIs
export const createDeliveryPerson = (data) => 
  API.post("/api/delivery-persons", data);

export const fetchDeliveryPersons = () => 
  API.get("/api/delivery-persons");

export const getDeliveryPerson = (id) => 
  API.get(`/api/delivery-persons/${id}`);

export const deleteDeliveryPerson = (id) => 
  API.delete(`/api/delivery-persons/${id}`);

//Notifications API
export const bookDemo = (demoData) => API.post('/api/notifications/public/contact', demoData);
export const fetchNotifications = (recipient) => API.get(`/api/notifications?recipient=${recipient}`);
// Individual read
export const markNotificationAsRead = (id) => API.post(`/api/notifications/${id}/read`);
// Bulk actions
export const markAllNotificationsAsRead = (recipient) => API.put(`/api/notifications/read-all?recipient=${recipient}`);
export const clearAllNotifications = (recipient) => API.delete(`/api/notifications/clear-all?recipient=${recipient}`);

// Reports related APIs

// Daily Report
export const fetchDailyReport = (date) =>
  API.get(endpoints.reports.daily(date));
// Sales Summary
export const fetchSalesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.salesSummary(from, to));
  }
  return API.get(endpoints.reports.salesSummary()); // no params
};

// GST Summary
export const fetchGstSummary = (from, to) =>
  API.get(endpoints.reports.gstSummary(from, to));
// GST Breakdown
export const fetchGstBreakdown = (from, to) =>
  API.get(endpoints.reports.gstBreakdown(from, to));
// Items Sold
export const fetchItemsSold = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.itemsSold(from, to));
  }
  return API.get(endpoints.reports.itemsSold());
};

// Category Sales
export const fetchCategorySales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.categorySales(from, to));
  }
  return API.get(endpoints.reports.categorySales());
};

// Customer Sales
export const fetchCustomerSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.customerSales(from, to));
  }
  return API.get(endpoints.reports.customerSales());
};

// Expenses Summary
export const fetchExpensesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.expensesSummary(from, to));
  }
  return API.get(endpoints.reports.expensesSummary());
};
// Payments Summary
export const fetchPaymentsSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.paymentsSummary(from, to));
  }
  return API.get(endpoints.reports.paymentsSummary());
};

// Generate Invoice for each sale by saleId or invoiceId
export const generateInvoice = ({ saleId, invoiceNo }) =>
  API.get(endpoints.generateInvoice({ saleId, invoiceNo }), { responseType: 'arraybuffer' });
// Expenses related APIs
export const createExpense = (data) => API.post(endpoints.expenses, data);
export const fetchExpenses = () => API.get(endpoints.expenses);
export const updateExpense = (id, data) => API.put(`${endpoints.expenses}/${id}`, data); // New function
export const deleteExpense = (id) => API.delete(`${endpoints.expenses}/${id}`);

export const exportBackup = () => API.post(endpoints.backup.export, {}, { responseType: 'blob' });

// Payments related APIs
export const recordDuePayment = (data) => API.post(endpoints.recordDuePayment, data);
export const recordDuePaymentsBatch = (data) => API.post('/api/payments/record-batch', data);

export const fetchPaymentHistory = (customerId, saleId, page = 0, size = 20) => {
  return API.get('/api/payments', {
    params: {
      customerId,
      page,
      size,
      ...(saleId ? { sourceType: 'SALE', sourceId: saleId } : {})
    },
  }).then((r) => {
    // Backend returns a Page object: { content: [], totalElements: X, ... }
    // We return the whole object so the UI can see totalElements for the pager
    return r.data; 
  }).catch(err => {
    console.error("Payment Fetch Error:", err);
    return { content: [], totalElements: 0 }; // Return safe default
  });
};
export const recordBulkPayment = (data) => API.post('/api/payments/bulk', data);
export const fetchCustomerAdvanceBalance = (customerId) => API.get(`/api/payments/customer/${customerId}/advance-balance`);

export const fetchProducts = () => API.get(endpoints.products);

//Audit Log APIs
// 1. Main Paginated Fetch (Used for the main table)
export const fetchAuditLogs = (params) => 
  API.get('/api/audit', { params }).then(res => res.data);

// 2. User-Specific Fetch (Used if you click on a username in the table)
export const fetchAuditLogsByUser = (username) => 
  API.get(`/api/audit/user/${username}`).then(res => res.data);

// 3. Export Logic (Used for the download button)
export const exportAuditLogs = (params) => 
  API.get('/api/audit/export', { 
    params, 
    responseType: 'blob' 
  });
// Analytics APIs
export const fetchRevenueLeakage = () => API.get(endpoints.analytics.revenueLeakage);
export const fetchItemDemand = () => API.get(endpoints.analytics.itemDemand);
export const fetchCustomerTrends = () => API.get(endpoints.analytics.customerTrends);
export const fetchFuturePurchaseOrders = () => API.get(endpoints.analytics.futurePurchaseOrders);
export const fetchTopItems = () => API.get(endpoints.analytics.topItems);
export const fetchSeasonalTrends = () => API.get(endpoints.analytics.seasonalTrends);
export const fetchChurnPrediction = () => API.get(endpoints.analytics.churnPrediction);
export const exportProcurementPlan = (format = 'xlsx') => 
  API.get(`${endpoints.analytics.exportProcurementPlan}?format=${format}`, { responseType: 'blob' });

// Receiving APIs
export const fetchReceiving = () =>
  API.get(endpoints.receiving).then(r => r.data);

export const fetchReceivingById = (id) =>
  API.get(endpoints.receivingById(id)).then(r => r.data);

export const fetchReceivingByPoId = (poId) =>
  API.get(endpoints.receivingByPoId(poId)).then(r => r.data);

export const fetchReceivingByPoNumber = (poNumber) =>
  API.get(endpoints.receivingByPoNumber(poNumber)).then(r => r.data);

export const createReceiving = (data) =>
  API.post(endpoints.receiving, data).then(r => r.data);

export const updateReceiving = (id, data) =>
  API.put(endpoints.receivingById(id), data).then(r => r.data);

export const deleteReceiving = (id) =>
  API.delete(endpoints.receivingById(id)).then(r => r.data);

export const createReceivingTicket = (data) =>
  API.post(endpoints.receivingTickets, data).then(r => r.data);

export const fetchReceivingTicketById = (id) =>
  API.get(endpoints.receivingTicketById(id)).then(r => r.data);

export const fetchAllTickets = () =>
  API.get(endpoints.fetchAllTicket).then(r => r.data);

export const initiateReceivingFromPO = (data) =>
  API.post(endpoints.receiveGoods, data).then(r => r.data);
export const addAttachmentToTicket = (data) =>
  API.post('{/tickets/${id}/attachments');
export const updateReceivingTicket = (data) =>
  API.put('{/tickets/${id}');
export const deleteReceivingTicket = (data) =>
  API.delete('{/tickets/${id}');

// --- Staff Management ---
export const fetchStaff = (month, year, page = 0, size = 100) =>
  API.get(endpoints.staff, {
    params: {
      month,
      year,
      page,
      size
    }
  }).then(r => r.data);

export const addStaff = (data) =>
  API.post(endpoints.staff, data).then(r => r.data);

export const updateStaff = (id, data) =>
  API.put(`${endpoints.staff}/${id}`, data).then(r => r.data);

export const deleteStaff = (id) =>
  API.delete(`${endpoints.staff}/${id}`).then(r => r.data);

// --- Advance Management ---
export const issueStaffAdvance = (id, amount, remarks) =>
  API.post(`${endpoints.staff}/${id}/advance`, null, { 
    params: { amount, remarks } 
  }).then(r => r.data);

// --- Payroll Processing ---
export const processSalary = (payload) =>
  API.post(endpoints.payrollProcess, payload).then(r => r.data);

// This is the one you'll use for your Bulk Selection later
export const processBulkSalary = (payloadArray) =>
  API.post(endpoints.payrollBulk, payloadArray).then(r => r.data);

// --- History ---
export const fetchStaffPaymentHistory = (staffId, page = 0, size = 10) =>
  API.get(`${endpoints.payrollHistory}/staff/${staffId}?page=${page}&size=${size}`).then(r => r.data);

// Subscription & Payment Verification APIs

// --- USER / SHOP OWNER ACTIONS ---

// Start the 14-day free trial (NEW - added to match controller)
export const startTrial = () => 
  API.post('/api/subscriptions/trial/start').then(res => res.data);

// Submit UPI/HDFC UTR for verification
export const submitPaymentUtr = (paymentData) => 
  API.post('/api/subscriptions/verify-payment', paymentData).then(res => res.data);

// Fetch current shop's subscription status, tier, and days remaining
export const fetchSubscriptionStatus = () => 
  API.get('/api/subscriptions/status').then(res => res.data);


// --- SUPER_ADMIN PLATFORM ACTIONS ---

// Admin: Get the queue of pending UTRs for manual bank statement checking
export const fetchPendingVerifications = () => 
  API.get('/api/subscriptions/platform/pending').then(res => res.data);

// Admin: Approve a payment (Activates the shop's plan)
export const approvePayment = (verificationId) => 
  API.post(`/api/subscriptions/platform/approve/${verificationId}`).then(res => res.data);

// Admin: Reject a payment (Requires a reason as a query param)
export const rejectPayment = (verificationId, reason) => 
  API.post(`/api/subscriptions/platform/reject/${verificationId}`, null, { 
    params: { reason } 
  }).then(res => res.data);

  export const fetchPlatformStats = () => 
  API.get('/api/subscriptions/platform/stats').then(res => res.data);

// Optional: Admin Platform Revenue Chart Data
export const fetchPlatformRevenueHistory = (days = 30) => 
  API.get('/api/subscriptions/platform/revenue-history', { params: { days } }).then(res => res.data);

// --- Support & Chat APIs ---

/**
 * For Shop Owners: Fetches their own chat history.
 * Logic: TenantContext on backend filters this by the shopId in the token.
 */
export const fetchMyChatHistory = () => 
  API.get('/api/support/history').then(res => res.data);

/**
 * For Super Admin: Fetches history of a specific shop.
 * Accessible only by ROLE_SUPER_ADMIN.
 */
export const fetchShopHistoryForAdmin = (shopId) => 
  API.get(`/api/support/history/${shopId}`).then(res => res.data);

/**
 * Admin: Mark messages for a shop as read.
 */
export const markChatAsRead = (shopId) => 
  API.post(`/api/support/mark-read/${shopId}`).then(res => res.data);
export const fetchAllConversations = () => 
  API.get('/api/support/admin/conversations').then(res => res.data);

export const fetchGlobalShopSummary = (page = 0, size = 20, sort = 'createdAt,desc') => 
  API.get(`/api/admin/shops/summary?page=${page}&size=${size}&sort=${sort}`)
    .then(res => res.data);

// Toggle a shop's active status (deactivates/activates all users of that shop)
export const toggleShopStatus = (shopId, active) => 
  API.patch(`/api/admin/shops/${shopId}/status?active=${active}`)
    .then(res => res.data);

// --- User Management API ---
export const fetchUsers = () =>
  API.get(endpoints.users).then(r => r.data);

export const adminCreateUser = (data) =>
  API.post(endpoints.users, data).then(r => r.data);

export const updateUser = (userId, data) =>
  API.put(endpoints.userById(userId), data).then(r => r.data);

export const updateUserStatus = (userId, isActive) =>
  API.patch(endpoints.userStatus(userId), { active: isActive }).then(r => r.data);

export const updateUserRole = (userId, role) =>
  API.patch(endpoints.userRole(userId), { role }).then(r => r.data);

export default API;