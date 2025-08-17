const API_BASE = '/api';

const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login`,
  },
  items: `${API_BASE}/catalog`,
  fetchItemVariants: `${API_BASE}/item-variants/filter`,
  fetchStock: `${API_BASE}/stock`,
  stock: `${API_BASE}/stock/add`,
  customers: `${API_BASE}/customers`,
  sales: `${API_BASE}/sales`,
  payments: `${API_BASE}/payments`,
  salesWithDue: `${API_BASE}/sales/with-due`,
  saleDueById: (id) => `${API_BASE}/sales/${id}/due`,
  recordDuePayment: `${API_BASE}/payments/record`,
  products: `${API_BASE}/products`,
  reports: {
    // Daily report requires a single date
    daily: (date) => `${API_BASE}/reports/daily?date=${date}`,

    // Sales summary requires a date range
    salesSummary: (from, to) => `${API_BASE}/reports/sales-summary?from=${from}&to=${to}`,

    // GST summary requires a date range
    gstSummary: (from, to) => `${API_BASE}/reports/gst-summary?from=${from}&to=${to}`,

    // GST breakdown requires a date range
    gstBreakdown: (from, to) => `${API_BASE}/reports/gst-breakdown?from=${from}&to=${to}`,
  },
  expenses: `${API_BASE}/expenses`,
  backup: {
    export: `${API_BASE}/backup/export`,
  },
};

export default endpoints;
