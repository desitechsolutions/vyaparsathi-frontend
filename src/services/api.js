import axios from 'axios';
import endpoints from './endpoints';
import { toast } from 'react-toastify';
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

// Interceptor to add the authorization token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized requests and refresh token if possible
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return API(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call your refresh endpoint (adjust if needed)
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(
          endpoints.auth.refresh,
          { refreshToken },
          { baseURL: API.defaults.baseURL, withCredentials: true }
        );
        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;
        setToken(newToken, newRefreshToken); // <-- always update token, refreshToken, and tokenExpiry
        API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        isRefreshing = false;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('refreshToken');
        toast.error('Your session has expired. Please log in again.', {
          position: 'top-right',
          autoClose: 5000,
        });
        window.location.href = '/login';
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

// Expenses related APIs
export const createExpense = (data) => API.post(endpoints.expenses, data);
export const fetchExpenses = () => API.get(endpoints.expenses);
export const updateExpense = (id, data) => API.put(`${endpoints.expenses}/${id}`, data); // New function
export const deleteExpense = (id) => API.delete(`${endpoints.expenses}/${id}`);


export const exportBackup = () => API.post(endpoints.backup.export, {}, { responseType: 'blob' });

// Payments related APIs
export const recordDuePayment = (data) => API.post(endpoints.recordDuePayment, data);

export const fetchProducts = () => API.get(endpoints.products);

export default API;