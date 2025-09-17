import { fetchCategories, fetchCategorySales } from "./api";

const API_BASE = '/api';

const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login`,
    refresh: `${API_BASE}/auth/refresh`,
    register: `${API_BASE}/auth/register`,
    forgotPin: `${API_BASE}/auth/forgot-pin`,
    resetPin: `${API_BASE}/auth/reset-pin`,
    changePin: `${API_BASE}/auth/change-pin`,
  },
  shop: `${API_BASE}/shop`,

  // User Management
  users: `${API_BASE}/admin/users`,
  userById: (id) => `${API_BASE}/admin/users/${id}`,
  userStatus: (id) => `${API_BASE}/admin/users/${id}/status`,
  userRole: (id) => `${API_BASE}/admin/users/${id}/role`,
  // Supplier endpoints
  suppliers: `${API_BASE}/suppliers`,
  supplierById: (id) => `${API_BASE}/suppliers/${id}`,

  purchaseOrders: `${API_BASE}/purchase-orders`,
  purchaseOrderById: (id) => `${API_BASE}/purchase-orders/${id}`,
  pendingPurchaseOrder: `${API_BASE}/purchase-orders/pending`,
  receivePurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/receive`,
  submitPurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/submit`,

  items: `${API_BASE}/catalog`,
  getItemById: (id) => `${API_BASE}/catalog/${id}`,
  updateItem: (id) => `${API_BASE}/catalog/${id}`,
  deleteItemVariant: (id) => `${API_BASE}/catalog/${id}`,
  fetchCategories: `${API_BASE}/categories`,

  fetchItemVariants: `${API_BASE}/item-variants/filter`,
  createItemVariant: `${API_BASE}/item-variants`,


  fetchCategorySales: `${API_BASE}/reports/category-sales`,
  fetchItemsSold: `${API_BASE}/reports/items-sold`,

  fetchStock: `${API_BASE}/stock`,
  stock: `${API_BASE}/stock/add`,

  customers: `${API_BASE}/customers`,
  sales: `${API_BASE}/sales`,
  salesByDateRange: (from, to) => `${API_BASE}/sales?from=${from}&to=${to}`,
  payments: `${API_BASE}/payments`,
  salesWithDue: `${API_BASE}/sales/with-due`,
  saleDueById: (id) => `${API_BASE}/sales/${id}/due`,
  recordDuePayment: `${API_BASE}/payments/record`,
  products: `${API_BASE}/products`,
  generateInvoice: ({ saleId, invoiceNo }) =>
  `${API_BASE}/invoices/download?${saleId ? `saleId=${saleId}` : `invoiceNo=${invoiceNo}`}`,

  //Delivery endpoints
  deliveryById: (id) => `${API_BASE}/deliveries/${id}`,
  assignDeliveryPerson: (id) => `${API_BASE}/deliveries/${id}/assign`,
  updateDeliveryStatus: (id) => `${API_BASE}/deliveries/${id}/status`,
  createDelivery: `${API_BASE}/deliveries`,
  fetchDeliveries: `${API_BASE}/deliveries/`,

  reports: {
    // Daily report requires a single date
  daily: (date) => `${API_BASE}/reports/daily?date=${date}`,
  salesSummary: (from, to) =>
    from && to
      ? `${API_BASE}/reports/sales-summary?from=${from}&to=${to}`
      : `${API_BASE}/reports/sales-summary`,
  gstSummary: (from, to) => `${API_BASE}/reports/gst-summary?from=${from}&to=${to}`,
  gstBreakdown: (from, to) =>
    `${API_BASE}/reports/gst-breakdown?from=${from}&to=${to}`,
  itemsSold: (from, to) =>
  from && to
    ? `${API_BASE}/reports/items-sold?from=${from}&to=${to}`
    : `${API_BASE}/reports/items-sold`,
  categorySales: (from, to) =>
  from && to
    ? `${API_BASE}/reports/category-sales?from=${from}&to=${to}`
    : `${API_BASE}/reports/category-sales`,
  customerSales: (from, to) =>
  from && to
    ? `${API_BASE}/reports/customer-sales?from=${from}&to=${to}`
    : `${API_BASE}/reports/customer-sales`,
  expensesSummary: (from, to) =>
  from && to
    ? `${API_BASE}/reports/expenses-summary?from=${from}&to=${to}`
    : `${API_BASE}/reports/expenses-summary`,
  paymentsSummary: (from, to) =>
  from && to
    ? `${API_BASE}/reports/payments-summary?from=${from}&to=${to}`
    : `${API_BASE}/reports/payments-summary`,
  },

  expenses: `${API_BASE}/expenses`,
  backup: {
    export: `${API_BASE}/backup/export`,
  },

   // Receiving endpoints
receiving: `${API_BASE}/receiving`,
receivingById: (id) => `${API_BASE}/receiving/${id}`,
receivingByPoId: (poId) => `${API_BASE}/receiving/by-po/${poId}`,
receivingByPoNumber: (poNumber) => `${API_BASE}/receiving/by-po-number/${poNumber}`,
receivingTickets: `${API_BASE}/receiving/tickets`,
receivingTicketById: (id) => `${API_BASE}/receiving/tickets/${id}`,
receiveGoods: `${API_BASE}/receiving/receive-goods`,

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
