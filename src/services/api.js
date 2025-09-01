import axios from 'axios';
import endpoints from './endpoints';
import 'react-toastify/dist/ReactToastify.css';
import { setToken } from '../utils/auth';

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

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for login or any request that explicitly opts out
    if (originalRequest && originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
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
        const res = await axios.post(endpoints.auth.refresh, { refreshToken }, { baseURL: API.defaults.baseURL });
        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;
        setToken(newToken, newRefreshToken);
        processQueue(null, newToken);
        isRefreshing = false;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Clear tokens on refresh failure
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Let AuthContext handle logout
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

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


// Item Variant APIs
export const createItemVariant = (data) => API.post(endpoints.createItemVariant, data)
export const deleteItemVariant = (id) => API.delete(endpoints.deleteItemVariant(id));
export const fetchItemVariants = (params = {}) => {
  return API.get(endpoints.fetchItemVariants, { params });
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

// Reports related APIs
export const fetchDailyReport = (date) => API.get(endpoints.reports.daily(date));
export const fetchSalesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.salesSummary(from, to));
  }
  return API.get(endpoints.reports.salesSummary()); // Call without params if not provided
};
export const fetchGstSummary = (from, to) => API.get(endpoints.reports.gstSummary(from, to));
export const fetchGstBreakdown = (from, to) => API.get(endpoints.reports.gstBreakdown(from, to));
export const fetchItemsSold = () => API.get(endpoints.fetchItemsSold);
export const fetchCategorySales = () => API.get(endpoints.fetchCategorySales);

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

// Receiving related APIs
export const fetchReceiving = () => API.get(endpoints.receiving).then(r => r.data);
export const createReceiving = (data) => API.post(endpoints.receiving, data).then(r => r.data);
export const updateReceiving = (id, data) => API.put(endpoints.receivingById(id), data).then(r => r.data);
export const fetchReceivingTickets = () => API.get(endpoints.receivingTickets).then(r => r.data);
export const createReceivingTicket = (data) => API.post(endpoints.receivingTickets, data).then(r => r.data);
export const fetchReceivingByPoId = (poId) =>
  API.get(`${endpoints.receiving}/by-po/${poId}`).then(r => r.data);
// --- Auth related API ---
// Use skipAuthRefresh on login to prevent refresh logic on login failure
export const login = (payload) =>
  API.post(endpoints.auth.login, payload, { skipAuthRefresh: true });

export default API;