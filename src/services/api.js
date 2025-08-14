import axios from 'axios';
import endpoints from './endpoints';
import { toast } from 'react-toastify'; // Install if not present: npm install react-toastify
import 'react-toastify/dist/ReactToastify.css';

const API = axios.create({
  baseURL: 'http://localhost:8080',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export default API;