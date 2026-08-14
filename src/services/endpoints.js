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
  shopOnboard: `${API_BASE}/shop/onboarding`,

  configIndustries: `${API_BASE}/config/industries`,
  configIndustryFields: (type) => `${API_BASE}/config/industries/${type}/fields`,

  customAttributes: `${API_BASE}/custom-attributes`,
  customAttributeById: (id) => `${API_BASE}/custom-attributes/${id}`,
  customAttributeReorder: `${API_BASE}/custom-attributes/reorder`,

  // User Management
  users: `${API_BASE}/admin/users`,
  userById: (id) => `${API_BASE}/admin/users/${id}`,
  userStatus: (id) => `${API_BASE}/admin/users/${id}/status`,
  userRole: (id) => `${API_BASE}/admin/users/${id}/role`,

  staff: `${API_BASE}/payroll/staff`,
  payrollProcess: `${API_BASE}/payroll/process`,
  payrollBulk: `${API_BASE}/payroll/process/bulk`,
  payrollHistory: `${API_BASE}/payroll/history`,

  // Supplier endpoints
  suppliers: `${API_BASE}/suppliers`,
  supplierById: (id) => `${API_BASE}/suppliers/${id}`,
  supplierPayments: `${API_BASE}/supplier-payments`,
  supplierPaymentsBulk: `${API_BASE}/supplier-payments/bulk`,
  supplierPaymentsSummary: (purchaseOrderId) => `${API_BASE}/supplier-payments/summary?purchaseOrderId=${purchaseOrderId}`,

  purchaseOrders: `${API_BASE}/purchase-orders`,
  purchaseOrderById: (id) => `${API_BASE}/purchase-orders/${id}`,
  pendingPurchaseOrder: `${API_BASE}/purchase-orders/pending`,
  openPurchaseOrders: `${API_BASE}/purchase-orders/open`,
  receivePurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/receive`,
  submitPurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/submit`,
  cancelPurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/cancel`,
  sendPurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/send`,
  markReceivedPurchaseOrder: (id) => `${API_BASE}/purchase-orders/${id}/mark-received`,

  items: `${API_BASE}/catalog`,
  getItemById: (id) => `${API_BASE}/catalog/${id}`,
  updateItem: (id) => `${API_BASE}/catalog/${id}`,
  deleteItemVariant: (id) => `${API_BASE}/catalog/${id}`,
  deleteItemsBulk: `${API_BASE}/catalog/bulk`,
  searchItems: `${API_BASE}/catalog/search`,
  fetchCategories: `${API_BASE}/categories`,
  categoryById: (id) => `${API_BASE}/categories/${id}`,

  fetchItemVariants: `${API_BASE}/item-variants/filter`,
  createItemVariant: `${API_BASE}/item-variants`,
  itemVariantById: (id) => `${API_BASE}/item-variants/${id}`,


  fetchCategorySales: `${API_BASE}/reports/category-sales`,
  fetchItemsSold: `${API_BASE}/reports/items-sold`,

  fetchStock: `${API_BASE}/stock`,
  stock: `${API_BASE}/stock/add`,
  stockTransfers: `${API_BASE}/stock-transfers`,
  stockTransferById: (id) => `${API_BASE}/stock-transfers/${id}`,
  executeStockTransfer: (id) => `${API_BASE}/stock-transfers/${id}/execute`,
  cancelStockTransfer: (id) => `${API_BASE}/stock-transfers/${id}/cancel`,
  pendingStockTransferCount: `${API_BASE}/stock-transfers/pending-count`,

  customers: `${API_BASE}/customers`,
  sales: `${API_BASE}/sales`,
  draftSale : `${API_BASE}/sales/drafts`,
  salesByDateRange: (from, to) => `${API_BASE}/sales?from=${from}&to=${to}`,
  payments: `${API_BASE}/payments`,
  salesWithDue: `${API_BASE}/sales/with-due`,
  salesHistory: `${API_BASE}/sales/history`,
  saleNotesById: (id) => `${API_BASE}/sales/${id}/notes`,
  saleDueById: (id) => `${API_BASE}/sales/${id}/due`,
  getSaleById: (id) => `${API_BASE}/sales/${id}`,
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
  salespersonLeaderboard: (from, to) =>
  from && to
    ? `${API_BASE}/reports/salesperson-leaderboard?from=${from}&to=${to}`
    : `${API_BASE}/reports/salesperson-leaderboard`,
  zReport: (date) =>
    date
      ? `${API_BASE}/reports/z-report?date=${date}`
      : `${API_BASE}/reports/z-report`,
  expensesSummary: (from, to) =>
  from && to
    ? `${API_BASE}/reports/expenses-summary?from=${from}&to=${to}`
    : `${API_BASE}/reports/expenses-summary`,
  paymentsSummary: (from, to) =>
  from && to
    ? `${API_BASE}/reports/payments-summary?from=${from}&to=${to}`
    : `${API_BASE}/reports/payments-summary`,
    exportAuditPack: (from, to) => `${API_BASE}/reports/export-audit-pack?from=${from}&to=${to}`,
  // Retail reports
  expiryReport: (days) => `${API_BASE}/reports/expiry-report?days=${days}`,
  purchaseRegister: (from, to) => `${API_BASE}/reports/purchase-register?from=${from}&to=${to}`,
  },

  expenses: `${API_BASE}/expenses`,
  backup: {
    export: `${API_BASE}/backup/export`,
  },

   // Receiving endpoints
receiving: `${API_BASE}/receiving`,
fetchAllTicket: `${API_BASE}/receiving/tickets`,
receivingById: (id) => `${API_BASE}/receiving/${id}`,
receivingByPoId: (poId) => `${API_BASE}/receiving/by-po/${poId}`,
receivingByPoNumber: (poNumber) => `${API_BASE}/receiving/by-po-number/${poNumber}`,
receivingTickets: `${API_BASE}/receiving/tickets`,
receivingTicketById: (id) => `${API_BASE}/receiving/tickets/${id}`,
receiveGoods: `${API_BASE}/receiving/receive-goods`,

  //Analytics endpoint
  analytics: {
    itemDemand: `${API_BASE}/analytics/item-demand`,
    customerTrends: `${API_BASE}/analytics/customer-trends`,
    futurePurchaseOrders: `${API_BASE}/analytics/future-purchase-orders`,
    topItems: `${API_BASE}/analytics/top-items`,
    seasonalTrends: `${API_BASE}/analytics/seasonal-trends`,
    churnPrediction: `${API_BASE}/analytics/churn-prediction`,
    exportProcurementPlan: `${API_BASE}/analytics/export/procurement-plan`,
    revenueLeakage: `${API_BASE}/analytics/revenue-leakage`,
    kpis: `${API_BASE}/analytics/kpis`,
    revenueTimeseries: `${API_BASE}/analytics/revenue-timeseries`,
    paymentMix: `${API_BASE}/analytics/payment-mix`,
    grossMargin: `${API_BASE}/analytics/gross-margin`,
  },
  newsletter: {
    subscribe: `${API_BASE}/newsletter/subscribe`,
    unsubscribe: `${API_BASE}/newsletter/unsubscribe`,
    adminSubscribers: `${API_BASE}/admin/newsletter/subscribers`,
    adminStats: `${API_BASE}/admin/newsletter/stats`,
    adminExport: `${API_BASE}/admin/newsletter/export`,
  },
};

export default endpoints;
