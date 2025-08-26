import { fetchCategorySales } from "./api";

const API_BASE = '/api';

const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login`,
    refresh: `${API_BASE}/auth/refresh`,
    register: `${API_BASE}/auth/register`,
  },
  shop: `${API_BASE}/shop`,

  // Supplier endpoints
  suppliers: `${API_BASE}/suppliers`,
  supplierById: (id) => `${API_BASE}/suppliers/${id}`,

  purchaseOrders: `${API_BASE}/purchase-orders`,
  purchaseOrderById: (id) => `${API_BASE}/purchase-orders/${id}`,
  receivePurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/receive`,

  items: `${API_BASE}/catalog`,
  getItemById: (id) => `${API_BASE}/catalog/${id}`,
  updateItem: (id) => `${API_BASE}/catalog/${id}`,
  deleteItemVariant: (id) => `${API_BASE}/catalog/${id}`,

  fetchItemVariants: `${API_BASE}/item-variants/filter`,
  createItemVariant: `${API_BASE}/item-variants`,


  fetchCategorySales: `${API_BASE}/reports/category-sales`,
  fetchItemsSold: `${API_BASE}/reports/items-sold`,

  fetchStock: `${API_BASE}/stock`,
  stock: `${API_BASE}/stock/add`,

  customers: `${API_BASE}/customers`,
  sales: `${API_BASE}/sales`,
  payments: `${API_BASE}/payments`,
  salesWithDue: `${API_BASE}/sales/with-due`,
  saleDueById: (id) => `${API_BASE}/sales/${id}/due`,
  recordDuePayment: `${API_BASE}/payments/record`,
  products: `${API_BASE}/products`,
generateInvoice: ({ saleId, invoiceNo }) =>
  `${API_BASE}/invoices/download?${saleId ? `saleId=${saleId}` : `invoiceNo=${invoiceNo}`}`,

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

    //Receiving endpoint
  receiving: `${API_BASE}/receiving`,
  receivingById: (id) => `${API_BASE}/receiving/${id}`,
  receivingTickets: `${API_BASE}/receiving/tickets`,
  
  //Analytics endpoint
  analytics: {
    itemDemand: `${API_BASE}/analytics/item-demand`,
    exportItemDemand: `${API_BASE}/analytics/export/item-demand`,
    customerTrends: `${API_BASE}/analytics/customer-trends`,
    futurePurchaseOrders: `${API_BASE}/analytics/future-purchase-orders`,
    topItems: `${API_BASE}/analytics/top-items`,
    seasonalTrends: `${API_BASE}/analytics/seasonal-trends`,
    churnPrediction: `${API_BASE}/analytics/churn-prediction`,
  },
};

export default endpoints;
