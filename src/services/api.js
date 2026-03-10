import axios from 'axios';
import endpoints from './endpoints';
import { signalApiActivity } from '../utils/auth';
import 'react-toastify/dist/ReactToastify.css';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
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

// --- REQUEST INTERCEPTOR ---
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API 401 received');
    }
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION API ---

export const login = (payload) =>
  API.post(endpoints.auth.login, payload, { skipAuthRefresh: true });

export const register = async (data) => {
  return API.post(endpoints.auth.register, data);
};

// Newly added to clear server-side cookie and DB token
export const logout = () => 
  API.post('/api/auth/logout', {}, { withCredentials: true });

export const forgotPassword = (data) => 
  API.post('/api/auth/forget-password', data, { skipAuthRefresh: true });

export const validateResetToken = (token) => 
  API.post('/api/auth/validate-reset-token', { token });

export const resetPassword = (data) => 
  API.post('/api/auth/reset-password', data, { skipAuthRefresh: true });

export const forgotPin = (data) => 
    API.post(endpoints.auth.forgotPin, data, { skipAuthRefresh: true });

export const resetPin = (data) => 
    API.post(endpoints.auth.resetPin, data, { skipAuthRefresh: true });

export const changePin = (data) => 
    API.post(endpoints.auth.changePin, data);

// This is simplified as the browser handles the token cookie
export const refreshToken = () =>
  API.post(endpoints.auth.refresh, {});

// --- SHOP & CORE ---

export const setupShop = (data) => API.post(endpoints.shopOnboard, data);

export const checkShopCode = async (code) => {
  const response = await API.get(`api/shop/check-code?code=${code}`);
  return response.data;
};

export const searchGlobalData = (query) => {
    return API.get(`/api/v1/search`, {
        params: { q: query }
    });
};

export const fetchShop = async () => {
  try {
    const res = await API.get(endpoints.shop);
    if (res.status === 204 || res.status === 404) {
      return { data: null, status: res.status };
    }
    return res;
  } catch (err) {
    if (err.response?.status === 204 || 
        err.response?.status === 404 ||
        err?.response?.data?.message?.includes('No active shop') ||
        err?.response?.data?.message?.includes('No shop context')) {
      return { data: null, status: err.response?.status || 404 };
    }
    console.error("fetchShop failed:", err);
    throw err;
  }
};

// --- PURCHASE ORDERS ---

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

// --- SUPPLIERS ---

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

// --- ITEMS & VARIANTS ---

export const createItem = (data) => API.post(endpoints.items, data);
export const fetchItems = () => API.get(endpoints.items);
export const getItemById = (id) => API.get(endpoints.getItemById(id));
export const updateItem = (id, data) => API.put(endpoints.updateItem(id), data);
export const fetchCategories = () => API.get(endpoints.fetchCategories);

export const createItemVariant = (data) => API.post(endpoints.createItemVariant, data)
export const deleteItemVariant = (id) => API.delete(endpoints.deleteItemVariant(id));
export const fetchItemVariants = (params = {}) => {
  return API.get(endpoints.fetchItemVariants, { params });
};
export const fetchItemVariantById = async (id) => {
  const response = await API.get(`/api/item-variants/${id}`);
  return response.data;
};

// --- STOCK MANAGEMENT ---

export const addStock = (data) => API.post(endpoints.stock, data);
export const fetchStock = () => API.get(endpoints.fetchStock);
export const fetchLowStockAlerts = () =>
  API.get('/api/stock/low-stock-alerts', { meta: { background: true } });
export const fetchExpiryAlerts = (daysBeforeExpiry = 90) =>
  API.get('/api/stock/expiry-alerts', { params: { daysBeforeExpiry }, meta: { background: true } });
export const adjustStock = (data) => API.post('/api/stock/adjust', data);
export const fetchStockMovements = (variantId) => API.get(`/api/stock/movements/${variantId}`);
export const exportStockReport = (startDate, endDate, format) => 
  API.get(`/api/stock/export`, { params: { startDate, endDate, format }, responseType: 'blob' });
export const fetchBatchWiseStock = () => API.get('/api/stock/batch-wise');
export const downloadStockImportTemplate = () =>
  API.get('/api/stock/import/template', { responseType: 'blob' });
export const importStockFromExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/api/stock/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- CUSTOMERS ---

export const fetchCustomers = () => API.get(endpoints.customers);
export const createCustomer = (data) => API.post(endpoints.customers, data);
export const updateCustomer = (id, data) => API.put(`${endpoints.customers}/${id}`, data);
export const fetchCustomer = (id, data) => API.get(`${endpoints.customers}/${id}`, data);
export const fetchCustomerLedger = (id, params = {}) => {
  return API.get(`/api/customers/${id}/ledger`, { params });
};

// --- SALES ---

export const createSale = (data) => {
  return API.post(endpoints.sales, data);
};
export const draftSale = (data) =>{
  return API.post(endpoints.draftSale, data)
}
export const completeDraftSale = async (id, data) => {
  return await API.put(`api/sales/${id}/complete`, data);
};
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

// --- DELIVERY ---

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

export const createDeliveryPerson = (data) => 
  API.post("/api/delivery-persons", data);
export const fetchDeliveryPersons = () => 
  API.get("/api/delivery-persons");
export const getDeliveryPerson = (id) => 
  API.get(`/api/delivery-persons/${id}`);
export const deleteDeliveryPerson = (id) => 
  API.delete(`/api/delivery-persons/${id}`);

// --- NOTIFICATIONS ---

export const bookDemo = (demoData) => API.post('/api/notifications/public/contact', demoData);
export const fetchNotifications = (recipient) => API.get(`/api/notifications?recipient=${recipient}`);
export const markNotificationAsRead = (id) => API.post(`/api/notifications/${id}/read`);
export const markAllNotificationsAsRead = (recipient) => API.put(`/api/notifications/read-all?recipient=${recipient}`);
export const clearAllNotifications = (recipient) => API.delete(`/api/notifications/clear-all?recipient=${recipient}`);

// --- REPORTS ---

export const fetchDailyReport = (date) =>
  API.get(endpoints.reports.daily(date));
export const fetchSalesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.salesSummary(from, to));
  }
  return API.get(endpoints.reports.salesSummary());
};
export const fetchGstSummary = (from, to) =>
  API.get(endpoints.reports.gstSummary(from, to));
export const fetchGstBreakdown = (from, to) =>
  API.get(endpoints.reports.gstBreakdown(from, to));
export const fetchItemsSold = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.itemsSold(from, to));
  }
  return API.get(endpoints.reports.itemsSold());
};
export const fetchCategorySales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.categorySales(from, to));
  }
  return API.get(endpoints.reports.categorySales());
};
export const fetchCustomerSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.customerSales(from, to));
  }
  return API.get(endpoints.reports.customerSales());
};
export const fetchExpensesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.expensesSummary(from, to));
  }
  return API.get(endpoints.reports.expensesSummary());
};
export const fetchPaymentsSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.paymentsSummary(from, to));
  }
  return API.get(endpoints.reports.paymentsSummary());
};
export const downloadAuditPack = (from, to) =>
  API.get(endpoints.reports.exportAuditPack(from, to), {
    responseType: 'blob', 
    timeout: 60000        
  });
export const generateInvoice = ({ saleId, invoiceNo }) =>
  API.get(endpoints.generateInvoice({ saleId, invoiceNo }), { responseType: 'arraybuffer' });

// --- EXPENSES ---

export const createExpense = (data) => API.post(endpoints.expenses, data);
export const fetchExpenses = () => API.get(endpoints.expenses);
export const updateExpense = (id, data) => API.put(`${endpoints.expenses}/${id}`, data);
export const deleteExpense = (id) => API.delete(`${endpoints.expenses}/${id}`);

// --- BACKUP ---

export const exportBackup = () => API.post(endpoints.backup.export, {}, { responseType: 'blob' });

// --- PAYMENTS ---

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
  }).then((r) => r.data)
    .catch(err => {
      console.error("Payment Fetch Error:", err);
      return { content: [], totalElements: 0 };
    });
};
export const recordBulkPayment = (data) => API.post('/api/payments/bulk', data);
export const fetchCustomerAdvanceBalance = (customerId) => API.get(`/api/payments/customer/${customerId}/advance-balance`);

export const fetchProducts = () => API.get(endpoints.products);

// --- AUDIT LOGS ---

export const fetchAuditLogs = (params) => 
  API.get('/api/audit', { params }).then(res => res.data);
export const fetchAuditLogsByUser = (username) => 
  API.get(`/api/audit/user/${username}`).then(res => res.data);
export const exportAuditLogs = (params) => 
  API.get('/api/audit/export', { 
    params, 
    responseType: 'blob' 
  });

// --- ANALYTICS ---

export const fetchRevenueLeakage = () => API.get(endpoints.analytics.revenueLeakage);
export const fetchItemDemand = () => API.get(endpoints.analytics.itemDemand);
export const fetchCustomerTrends = () => API.get(endpoints.analytics.customerTrends);
export const fetchFuturePurchaseOrders = () => API.get(endpoints.analytics.futurePurchaseOrders);
export const fetchTopItems = () => API.get(endpoints.analytics.topItems);
export const fetchSeasonalTrends = () => API.get(endpoints.analytics.seasonalTrends);
export const fetchChurnPrediction = () => API.get(endpoints.analytics.churnPrediction);
export const exportProcurementPlan = (format = 'xlsx') => 
  API.get(`${endpoints.analytics.exportProcurementPlan}?format=${format}`, { responseType: 'blob' });

// --- RECEIVING ---

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
  API.post(`/api/tickets/${data.id}/attachments`);
export const updateReceivingTicket = (data) =>
  API.put(`/api/tickets/${data.id}`);
export const deleteReceivingTicket = (id) =>
  API.delete(`/api/tickets/${id}`);

// --- STAFF & PAYROLL ---

export const fetchStaff = (month, year, page = 0, size = 100) =>
  API.get(endpoints.staff, {
    params: { month, year, page, size }
  }).then(r => r.data);
export const addStaff = (data) =>
  API.post(endpoints.staff, data).then(r => r.data);
export const updateStaff = (id, data) =>
  API.put(`${endpoints.staff}/${id}`, data).then(r => r.data);
export const deleteStaff = (id) =>
  API.delete(`${endpoints.staff}/${id}`).then(r => r.data);
export const issueStaffAdvance = (id, amount, remarks) =>
  API.post(`${endpoints.staff}/${id}/advance`, null, { 
    params: { amount, remarks } 
  }).then(r => r.data);
export const processSalary = (payload) =>
  API.post(endpoints.payrollProcess, payload).then(r => r.data);
export const processBulkSalary = (payloadArray) =>
  API.post(endpoints.payrollBulk, payloadArray).then(r => r.data);
export const fetchStaffPaymentHistory = (staffId, page = 0, size = 10) =>
  API.get(`${endpoints.payrollHistory}/staff/${staffId}?page=${page}&size=${size}`).then(r => r.data);

// --- SUBSCRIPTIONS ---

export const startTrial = () => 
  API.post('/api/subscriptions/trial/start').then(res => res.data);
export const submitPaymentUtr = (paymentData) => 
  API.post('/api/subscriptions/verify-payment', paymentData).then(res => res.data);
export const fetchSubscriptionStatus = () => 
  API.get('/api/subscriptions/status').then(res => res.data);
export const fetchMyPaymentHistory = () => 
  API.get('/api/subscriptions/my-payments').then(res => res.data);
export const cancelSubscription = () => 
  API.post('/api/subscriptions/cancel').then(res => res.data);
export const downloadInvoice = (paymentId) => {
    return API.get(`/api/invoices/subscription/${paymentId}`, {
        responseType: 'blob',
    });
};

// --- PLATFORM ADMIN ACTIONS ---

export const fetchPendingVerifications = () => 
  API.get('/api/subscriptions/platform/pending').then(res => res.data);
export const approvePayment = (verificationId) => 
  API.post(`/api/subscriptions/platform/approve/${verificationId}`).then(res => res.data);
export const rejectPayment = (verificationId, reason) => 
  API.post(`/api/subscriptions/platform/reject/${verificationId}`, null, { 
    params: { reason } 
  }).then(res => res.data);
  export const fetchPlatformStats = () => 
  API.get('/api/subscriptions/platform/stats').then(res => res.data);
export const fetchPlatformRevenueHistory = (days = 30) => 
  API.get('/api/subscriptions/platform/revenue-history', { params: { days } }).then(res => res.data);

export const fetchActivePricingPlans = () => 
  API.get('/api/pricing/active').then(res => res.data);

export const updatePlanConfig = (planDto) => 
  API.put('/api/pricing/admin/update', planDto).then(res => res.data);

export const fetchPlanDetailsByTier = (tier) => 
  API.get(`/api/pricing/admin/${tier}`).then(res => res.data);

// --- SUPPORT & CHAT ---

export const fetchMyChatHistory = () => 
  API.get('/api/support/history').then(res => res.data);
export const fetchShopHistoryForAdmin = (shopId) => 
  API.get(`/api/support/history/${shopId}`).then(res => res.data);
export const markChatAsRead = (shopId) => 
  API.post(`/api/support/mark-read/${shopId}`).then(res => res.data);
export const fetchAllConversations = () => 
  API.get('/api/support/admin/conversations').then(res => res.data);

// --- ADMIN SHOP MANAGEMENT ---

export const fetchGlobalShopSummary = (page = 0, size = 20, sort = 'createdAt,desc') => 
  API.get(`/api/admin/shops/summary?page=${page}&size=${size}&sort=${sort}`)
    .then(res => res.data);
export const toggleShopStatus = (shopId, active) => 
  API.patch(`/api/admin/shops/${shopId}/status?active=${active}`)
    .then(res => res.data);

  export const fetchFileBlob = (path) => {
  return API.get(`/api/files/display`, {
    params: { path },
    responseType: 'blob',
  });
};

// --- PHARMA REPORTS ---

export const fetchExpiryReport = (days) =>
  API.get(endpoints.reports.expiryReport(days)).then(r => r.data);

export const fetchNarcoticsRegister = (from, to) =>
  API.get(endpoints.reports.narcoticsRegister(from, to)).then(r => r.data);

export const fetchPurchaseRegister = (from, to) =>
  API.get(endpoints.reports.purchaseRegister(from, to)).then(r => r.data);

export const fetchItemSubstitutes = (itemId) =>
  API.get(endpoints.itemSubstitutes(itemId)).then(r => r.data);

// --- USER MANAGEMENT ---

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