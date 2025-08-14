import axios from 'axios';
import endpoints from './endpoints';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API = axios.create({
  baseURL: 'http://localhost:8080',
});

// Interceptor to add the authorization token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized requests and log the user out
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      toast.error('Your session has expired. Please log in again.', {
        position: 'top-right',
        autoClose: 5000,
      });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Existing API functions
export const fetchItems = () => API.get(endpoints.items);
export const createItem = (data) => API.post(endpoints.items, data);
export const fetchStock = () => API.get(endpoints.stock);
export const addStock = (data) => API.post(endpoints.stock, data);
export const fetchCustomers = () => API.get(endpoints.customers);
export const createCustomer = (data) => API.post(endpoints.customers, data);
export const createSale = (data) => API.post(endpoints.sales, data);
export const fetchDailyReport = (date) => API.get(endpoints.reports.daily(date));
export const createExpense = (data) => API.post(endpoints.expenses, data);
export const exportBackup = () => API.post(endpoints.backup.export, {}, { responseType: 'blob' });

// New API functions for reports
/**
 * Fetches the sales summary for a given date range.
 * @param {string} from - The start date in 'YYYY-MM-DD' format.
 * @param {string} to - The end date in 'YYYY-MM-DD' format.
 * @returns {Promise<any>}
 */
export const fetchSalesSummary = (from, to) => API.get(endpoints.reports.salesSummary(from, to));

/**
 * Fetches the GST summary for a given date range.
 * @param {string} from - The start date in 'YYYY-MM-DD' format.
 * @param {string} to - The end date in 'YYYY-MM-DD' format.
 * @returns {Promise<any>}
 */
export const fetchGstSummary = (from, to) => API.get(endpoints.reports.gstSummary(from, to));

/**
 * Fetches the GST breakdown by rate for a given date range.
 * @param {string} from - The start date in 'YYYY-MM-DD' format.
 * @param {string} to - The end date in 'YYYY-MM-DD' format.
 * @returns {Promise<any>}
 */
export const fetchGstBreakdown = (from, to) => API.get(endpoints.reports.gstBreakdown(from, to));

export default API;
