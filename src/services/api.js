import axios from 'axios';
import endpoints from './endpoints';
import { signalApiActivity } from '../utils/auth';
import 'react-toastify/dist/ReactToastify.css';

const API = axios.create({
  baseURL: 'http://localhost:8080',
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

        const res = await axios.post(endpoints.auth.refresh, { refreshToken }, { baseURL: API.defaults.baseURL });
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
export const forgotPin = (data) => API.post(endpoints.auth.forgotPin, data, { skipAuthRefresh: true });
export const resetPin = (data) => API.post(endpoints.auth.resetPin, data, { skipAuthRefresh: true });
export const changePin = (data) => API.post(endpoints.auth.changePin, data);
// API functions
export const setupShop = (data) => API.post(endpoints.shop, data);
export const refreshToken = (refreshToken) =>
  API.post(endpoints.auth.refresh, { refreshToken });
// GET SHOP
export const fetchShop = () => API.get(endpoints.shop);

// --- Purchase Orders ---
export const getPurchaseOrders = () =>
  API.get(endpoints.purchaseOrders).then((r) => r.data);

export const getPurchaseOrderById = (id) =>
  API.get(endpoints.purchaseOrderById(id)).then((r) => r.data);

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

// Customer related APIs
export const fetchCustomers = () => API.get(endpoints.customers);
export const createCustomer = (data) => API.post(endpoints.customers, data);
export const updateCustomer = (id, data) => API.put(`${endpoints.customers}/${id}`, data);
export const fetchCustomer = (id, data) => API.get(`${endpoints.customers}/${id}`, data);

//Sales related APIs
export const createSale = (data) => {
  return API.post(endpoints.sales, data, {
    responseType: 'arraybuffer', // Handle binary PDF response
  }).then((response) => {
    console.log('Raw Response Data:', response.data); // Debug log
    return { data: new Uint8Array(response.data) }; // Convert ArrayBuffer to Uint8Array
  });
};
export const fetchSalesWithDue = () => API.get(endpoints.salesWithDue);
export const fetchCustomerDues = (customerId) => API.get(`${endpoints.sales}/${customerId}/dues`);
export const fetchSaleDueById = (id) => API.get(endpoints.saleDueById(id));
export const fetchAllSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.salesByDateRange(from, to));
  }
  return API.get(endpoints.sales);
};

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
export const fetchNotifications = (recipient) => API.get(`/api/notifications?recipient=${recipient}`);
export const markNotificationAsRead = (id) => API.patch(`/api/notifications/${id}/read`);

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
// --- IMPORTANT: Background polling for low stock alerts ---
export const fetchLowStockAlerts = () =>
  API.get('/api/stock/low-stock-alerts', { meta: { background: true } });
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

export const fetchPaymentHistory = (customerId, saleId) => {
  return API.get('/api/payments', {
    params: {
      customerId,
      ...(saleId ? { sourceType: 'SALE', sourceId: saleId } : {})
    },
  }).then((r) => r.data || []);
};

export const fetchProducts = () => API.get(endpoints.products);

// Analytics APIs
export const fetchItemDemand = () => API.get(endpoints.analytics.itemDemand);
export const exportItemDemand = (format = 'xlsx') =>
  API.get(`${endpoints.analytics.exportItemDemand}?format=${format}`, { responseType: 'blob' });
export const fetchCustomerTrends = () => API.get(endpoints.analytics.customerTrends);
export const fetchFuturePurchaseOrders = () => API.get(endpoints.analytics.futurePurchaseOrders);
export const fetchTopItems = () => API.get(endpoints.analytics.topItems);
export const fetchSeasonalTrends = () => API.get(endpoints.analytics.seasonalTrends);
export const fetchChurnPrediction = () => API.get(endpoints.analytics.churnPrediction);

// Receiving APIs
export const fetchReceiving = () =>
  API.get(endpoints.receiving).then(r => r.data);

export const fetchReceivingById = (id) =>
  API.get(endpoints.receivingById(id)).then(r => r.data);

export const fetchReceivingByPoId = (poId) =>
  API.get(endpoints.receivingByPoId(poId)).then(r => r.data);

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

export const initiateReceivingFromPO = (data) =>
  API.post(endpoints.receiveGoods, data).then(r => r.data);

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