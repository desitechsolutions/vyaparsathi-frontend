const API_BASE = '/api';

const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login`,
  },
  items: `${API_BASE}/items`,
  stock: `${API_BASE}/stock/add`,
  customers: `${API_BASE}/customers`,
  sales: `${API_BASE}/sales`,
  reports: {
    daily: (date) => `${API_BASE}/reports/daily?date=${date}`,
  },
  expenses: `${API_BASE}/expenses`,
  backup: {
    export: `${API_BASE}/backup/export`,
  },
};

export default endpoints;