import axios from 'axios';
import endpoints from './endpoints';
import 'react-toastify/dist/ReactToastify.css';
import { getValidToken, clearAuthStorage } from '../utils/authStorage';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const getRequest = (url, config) => API.get(url, config);

export let isRefreshing = false;
export let failedQueue = [];

export const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- REQUEST INTERCEPTOR ---
API.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      clearAuthStorage();
      if (!isLoginRequest && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION API ---

export const login = (payload) =>
  API.post(endpoints.auth.login, payload, { skipAuthRefresh: true });

export const register = async (data) => {
  return API.post(endpoints.auth.register, data);
};

// Newly added to clear server-side cookie and DB token
export const logout = () =>
  API.post('/api/auth/logout', {}, { withCredentials: true });

export const forgotPassword = (data) =>
  API.post('/api/auth/forget-password', data, { skipAuthRefresh: true });

export const validateResetToken = (token) =>
  API.post('/api/auth/validate-reset-token', { token });

export const resetPassword = (data) =>
  API.post('/api/auth/reset-password', data, { skipAuthRefresh: true });

export const forgotPin = (data) =>
  API.post(endpoints.auth.forgotPin, data, { skipAuthRefresh: true });

export const resetPin = (data) =>
  API.post(endpoints.auth.resetPin, data, { skipAuthRefresh: true });

export const changePin = (data) =>
  API.post(endpoints.auth.changePin, data);

// This is simplified as the browser handles the token cookie
export const refreshToken = () =>
  API.post(endpoints.auth.refresh, {});

// --- SHOP & CORE ---

export const setupShop = (data) => API.post(endpoints.shopOnboard, data);

export const checkShopCode = async (code) => {
  const response = await API.get(`api/shop/check-code?code=${code}`);
  return response.data;
};

export const searchGlobalData = (query) => {
  return API.get(`/api/v1/search`, {
    params: { q: query }
  });
};

export const fetchShop = async () => {
  try {
    const res = await API.get(endpoints.shop);
    if (res.status === 204 || res.status === 404) {
      return { data: null, status: res.status };
    }
    return res;
  } catch (err) {
    if (err.response?.status === 204 ||
      err.response?.status === 404 ||
      err?.response?.data?.message?.includes('No active shop') ||
      err?.response?.data?.message?.includes('No shop context')) {
      return { data: null, status: err.response?.status || 404 };
    }
    console.error("fetchShop failed:", err);
    throw err;
  }
};

// --- PURCHASE ORDERS ---

export const getPurchaseOrders = () =>
  API.get(endpoints.purchaseOrders).then((r) => r.data);

export const getPurchaseOrderById = (id) =>
  API.get(endpoints.purchaseOrderById(id)).then((r) => r.data);

export const pendingPurchaseOrders = () =>
  API.get(endpoints.pendingPurchaseOrder).then((r) => r.data);

export const createPurchaseOrder = (data) =>
  API.post(endpoints.purchaseOrders, data).then((r) => r.data);

export const updatePurchaseOrder = (id, data) =>
  API.put(endpoints.purchaseOrderById(id), data).then((r) => r.data);

// --- PURCHASE INVOICES ---
// Standalone Purchase Invoice creation. Pass `receivingId` to link to a GRN;
// when linked, the backend will NOT re-add stock (the GRN already did).
// Direct-invoice flows (no GRN) omit `receivingId` — the invoice will add
// stock as before.
export const createPurchaseInvoice = (data) =>
  API.post('/api/v1/purchases', data).then((r) => r.data);

export const listPurchaseInvoices = (page = 0, size = 20) =>
  API.get('/api/v1/purchases', { params: { page, size } }).then((r) => r.data);

export const getPurchaseInvoiceById = (id) =>
  API.get(`/api/v1/purchases/${id}`).then((r) => r.data);

export const deletePurchaseOrder = (id) =>
  API.delete(endpoints.purchaseOrderById(id)).then((r) => r.data);

export const receivePurchaseOrder = (id) =>
  API.post(endpoints.receivePurchaseOrder(id)).then((r) => r.data);

export const submitPurchaseOrder = (id) =>
  API.post(endpoints.submitPurchaseOrder(id)).then((r) => r.data);

// --- SUPPLIERS ---

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

// --- SUPPLIER PAYMENTS ---

export const recordSupplierPayment = (data) =>
  API.post(endpoints.supplierPayments, data).then((r) => r.data);

export const recordBulkSupplierPayment = (data) =>
  API.post(endpoints.supplierPaymentsBulk, data).then((r) => r.data);

export const getSupplierPayments = (params = {}) =>
  API.get(endpoints.supplierPayments, { params }).then((r) => r.data);

export const getSupplierPaymentSummary = (purchaseOrderId) =>
  API.get(endpoints.supplierPaymentsSummary(purchaseOrderId)).then((r) => r.data);

// --- ITEMS & VARIANTS ---

export const createItem = (data) => API.post(endpoints.items, data);
export const fetchItems = () => API.get(endpoints.items);
export const getItemById = (id) => API.get(endpoints.getItemById(id));
export const updateItem = (id, data) => API.put(endpoints.updateItem(id), data);
export const fetchCategories = () => API.get(endpoints.fetchCategories);
export const fetchItemSubstitutes = (itemId) => API.get(`${endpoints.items}/${itemId}/substitutes`);

export const createItemVariant = (data) => API.post(endpoints.createItemVariant, data)
export const deleteItemVariant = (id) => API.delete(endpoints.deleteItemVariant(id));
export const updateItemVariant = (id, data) => API.put(endpoints.itemVariantById(id), data);
export const fetchItemVariants = (params = {}) => {
  return API.get(endpoints.fetchItemVariants, { params });
};
export const fetchItemVariantById = async (id) => {
  const response = await API.get(endpoints.itemVariantById(id));
  return response.data;
};

// --- STOCK MANAGEMENT ---

export const addStock = (data) => API.post(endpoints.stock, data);
export const fetchStock = () => API.get(endpoints.fetchStock);
export const fetchLowStockAlerts = () =>
  API.get('/api/stock/low-stock-alerts', { meta: { background: true } });
export const lookupByBarcode = (code) =>
  API.get(`/api/item-variants/barcode/${encodeURIComponent(code)}`).then((r) => r.data);

// --- STOCK TRANSFERS ---

export const fetchStockTransfers = () =>
  API.get(endpoints.stockTransfers).then((r) => r.data);

export const getStockTransferById = (id) =>
  API.get(endpoints.stockTransferById(id)).then((r) => r.data);

export const createStockTransfer = (data) =>
  API.post(endpoints.stockTransfers, data).then((r) => r.data);

export const executeStockTransfer = (id) =>
  API.post(endpoints.executeStockTransfer(id)).then((r) => r.data);

export const cancelStockTransfer = (id) =>
  API.post(endpoints.cancelStockTransfer(id)).then((r) => r.data);

export const fetchPendingStockTransferCount = () =>
  API.get(endpoints.pendingStockTransferCount, { meta: { background: true } }).then((r) => r.data);
export const fetchExpiryAlerts = (daysBeforeExpiry = 90) =>
  API.get('/api/stock/expiry-alerts', { params: { daysBeforeExpiry }, meta: { background: true } });
export const adjustStock = (data) => API.post('/api/stock/adjust', data);
export const fetchStockMovements = (variantId) => API.get(`/api/stock/movements/${variantId}`);
export const exportStockReport = (startDate, endDate, format) =>
  API.get(`/api/stock/export`, { params: { startDate, endDate, format }, responseType: 'blob' });
export const fetchBatchWiseStock = (variantId = null) =>
  API.get('/api/stock/batch-wise', variantId ? { params: { variantId } } : {});
export const downloadStockImportTemplate = () =>
  API.get('/api/stock/import/template', { responseType: 'blob' });
export const importStockFromExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/api/stock/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- CUSTOMERS ---

export const fetchCustomers = () => API.get(endpoints.customers);
export const createCustomer = (data) => API.post(endpoints.customers, data);
export const updateCustomer = (id, data) => API.put(`${endpoints.customers}/${id}`, data);
export const fetchCustomer = (id, data) => API.get(`${endpoints.customers}/${id}`, data);
export const fetchCustomerLedger = (id, params = {}) => {
  return API.get(`/api/customers/${id}/ledger`, { params });
};

// --- SALES ---

export const createSale = (data) => {
  return API.post(endpoints.sales, data);
};
export const draftSale = (data) => {
  return API.post(endpoints.draftSale, data)
}
export const completeDraftSale = async (id, data) => {
  return await API.put(`api/sales/${id}/complete`, data);
};
export const processSaleReturn = (saleId, returnData) =>
  API.post(`/api/sales/${saleId}/return`, returnData);

export const cancelSale = (saleId, reason) =>
  API.post(`/api/sales/${saleId}/cancel?reason=${encodeURIComponent(reason)}`, {});

export const fetchSalesWithDue = () => API.get(endpoints.salesWithDue);
/**
 * Paginated + filtered sales history.
 *
 * All params are optional:
 *   page       — 0-based page index (default 0)
 *   size       — page size (default 50)
 *   q          — free-text: matches invoiceNo or customer.name (case-insensitive)
 *   status     — SaleStatus (DRAFT / COMPLETED / PARTIALLY_RETURNED / RETURNED / CANCELLED).
 *                When omitted the server returns everything except CANCELLED (legacy default).
 *   customerId — filter to one customer
 *   from / to  — ISO date strings (YYYY-MM-DD), inclusive
 *
 * Backend contract: {@code Page<SaleDueDto>} — { content, totalElements, totalPages, number, size, ... }.
 * Callers that used the legacy no-arg helper keep working: with no params the server
 * defaults to page=0, size=50, filters null.
 */
/**
 * Update sale-level notes only (metadata edit, no ledger/stock impact).
 * Pass an empty string or null to clear.
 */
export const updateSaleNotes = (saleId, notes) =>
  API.patch(endpoints.saleNotesById(saleId), { notes });

/**
 * Park a DRAFT sale (POS "hold order for later"). Server transitions DRAFT → HELD.
 * Idempotent — parking a HELD sale is a no-op. Any other status rejects.
 */
export const parkSale = (saleId) => API.post(`/api/sales/${saleId}/park`);

/**
 * Resume a HELD sale — server transitions HELD → DRAFT so the standard
 * complete-draft flow works unchanged.
 */
export const resumeSale = (saleId) => API.post(`/api/sales/${saleId}/resume`);

/**
 * Discard a DRAFT or HELD sale (hard-delete). Rejects anything else on the server.
 * Used to clean up an orphaned draft when the caller pivots to another sale type
 * (e.g. save-as-proforma after previously saving as draft).
 */
export const discardDraftSale = (saleId) => API.delete(`/api/sales/drafts/${saleId}`);

/**
 * Read-only timeline of state-mutating events for a single sale (returns,
 * cancels, parks, resumes, note edits + linked credit notes). Powers the
 * "Void / refund history" dialog in SalesHistory.
 */
export const fetchSaleTimeline = (saleId) =>
  API.get(`/api/sales/${saleId}/timeline`);

export const fetchSalesHistory = (opts = {}) => {
  const {
    page,
    size,
    q,
    status,
    customerId,
    from,
    to,
  } = opts || {};
  const params = {};
  if (page != null)       params.page = page;
  if (size != null)       params.size = size;
  if (q && q.trim())      params.q = q.trim();
  if (status)             params.status = status;
  if (customerId != null) params.customerId = customerId;
  if (from)               params.from = from;
  if (to)                 params.to = to;
  return API.get(endpoints.salesHistory, { params });
};
export const fetchCustomerDues = (customerId) => API.get(`${endpoints.sales}/${customerId}/dues`);
export const fetchSaleDueById = (id) => API.get(endpoints.saleDueById(id));
export const fetchAllSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.salesByDateRange(from, to));
  }
  return API.get(endpoints.sales);
};
export const getSaleById = (id) => API.get(endpoints.getSaleById(id));

// --- DELIVERY ---

export const createDelivery = (data) => API.post(endpoints.createDelivery, data);
export const getDelivery = (id) => API.get(endpoints.deliveryById(id));

/**
 * Paginated + filtered delivery list.
 *
 * Backend returns Spring's Page shape ({content, totalElements, ...}).
 * For call sites that only want the rows array, use `fetchDeliveries()` — it
 * unwraps `content` for you. Filter/paginate variants call `fetchDeliveriesPage`.
 *
 * Signature is deliberately backwards-compat: a plain number/string is treated
 * as a saleId to match the original callers, while an object is treated as a
 * full param map.
 */
export const fetchDeliveriesPage = (params = {}) =>
  API.get('/api/deliveries', { params });
export const fetchDeliveries = (arg) => {
  const params =
    arg == null ? {}
    : typeof arg === 'object' ? arg
    : { saleId: arg };
  // Unwrap Page.content so existing call sites that do `res.data.map(...)`
  // keep working without change.
  return fetchDeliveriesPage(params).then((res) => ({
    ...res,
    data: res.data?.content ?? res.data ?? [],
    page: {
      totalElements: res.data?.totalElements ?? 0,
      totalPages:    res.data?.totalPages ?? 1,
      number:        res.data?.number ?? 0,
      size:          res.data?.size ?? (res.data?.content?.length ?? 0),
    },
  }));
};

export const fetchDeliveriesBySale = (saleId) =>
  API.get(`/api/deliveries/by-sale/${saleId}`);

export const updateDeliveryDetails = (id, data) =>
  API.patch(`/api/deliveries/${id}/details`, data);
export const assignDeliveryPerson = (id, person) =>
  API.patch(`/api/deliveries/${id}/person`, { deliveryPerson: person });

/**
 * Update delivery status. The old `changedBy` argument is retained for
 * backwards compatibility with existing callers but is IGNORED — the backend
 * now derives the audit-trail author from the JWT. Pass `note` to attach a
 * comment to the audit-trail row.
 */
export const updateDeliveryStatus = (id, status, _changedByDeprecated, note) => {
  const params = { status };
  if (note) params.note = note;
  return API.patch(`/api/deliveries/${id}/status`, null, { params });
};

export const capturePod = (id, podFields) =>
  API.patch(`/api/deliveries/${id}/pod`, podFields);

/**
 * Upload a signature image (PNG / JPEG) for a delivery. `file` is a Blob or File.
 * The backend stores it via the configured FileStorageService and returns the
 * updated DeliveryDTO with podSignatureUrl set.
 */
export const uploadPodSignature = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(`/api/deliveries/${id}/pod/signature`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadPodPhoto = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(`/api/deliveries/${id}/pod/photo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const bulkAssignDeliveries = (deliveryIds, personId) =>
  API.post('/api/deliveries/bulk-assign', { deliveryIds, personId });
export const recordDeliveryAttempt = (id, reason) =>
  API.post(`/api/deliveries/${id}/attempts`, null, { params: reason ? { reason } : {} });
export const fetchDeliveryMetrics = (opts = {}) => {
  const params = {};
  if (opts.from) params.from = opts.from;
  if (opts.to)   params.to = opts.to;
  return API.get('/api/deliveries/metrics', { params });
};

export const fetchDeliveryHistory = (id) =>
  API.get(`/api/deliveries/${id}/history`);
export const deleteDelivery = (id) => API.delete(`/api/deliveries/${id}`);

export const createDeliveryPerson = (data) =>
  API.post("/api/delivery-persons", data);
export const updateDeliveryPerson = (id, data) =>
  API.put(`/api/delivery-persons/${id}`, data);
export const fetchDeliveryPersons = () =>
  API.get("/api/delivery-persons");
export const getDeliveryPerson = (id) =>
  API.get(`/api/delivery-persons/${id}`);
export const deleteDeliveryPerson = (id) =>
  API.delete(`/api/delivery-persons/${id}`);

// --- NOTIFICATIONS ---

export const bookDemo = (demoData) => API.post('/api/notifications/public/contact', demoData);
export const fetchNotifications = (recipient) => API.get(`/api/notifications?recipient=${recipient}`);
export const markNotificationAsRead = (id) => API.post(`/api/notifications/${id}/read`);
export const markAllNotificationsAsRead = (recipient) => API.put(`/api/notifications/read-all?recipient=${recipient}`);
export const clearAllNotifications = (recipient) => API.delete(`/api/notifications/clear-all?recipient=${recipient}`);

// --- REPORTS ---

export const fetchDailyReport = (date) =>
  API.get(endpoints.reports.daily(date));
export const fetchSalesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.salesSummary(from, to));
  }
  return API.get(endpoints.reports.salesSummary());
};
export const fetchGstSummary = (from, to) =>
  API.get(endpoints.reports.gstSummary(from, to));
export const fetchGstBreakdown = (from, to) =>
  API.get(endpoints.reports.gstBreakdown(from, to));
export const fetchItemsSold = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.itemsSold(from, to));
  }
  return API.get(endpoints.reports.itemsSold());
};
export const fetchCategorySales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.categorySales(from, to));
  }
  return API.get(endpoints.reports.categorySales());
};
export const fetchCustomerSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.customerSales(from, to));
  }
  return API.get(endpoints.reports.customerSales());
};
export const fetchExpensesSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.expensesSummary(from, to));
  }
  return API.get(endpoints.reports.expensesSummary());
};
export const fetchPaymentsSummary = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.paymentsSummary(from, to));
  }
  return API.get(endpoints.reports.paymentsSummary());
};
export const downloadAuditPack = (from, to) =>
  API.get(endpoints.reports.exportAuditPack(from, to), {
    responseType: 'blob',
    timeout: 60000
  });
export const generateInvoice = ({ saleId, invoiceNo }) =>
  API.get(endpoints.generateInvoice({ saleId, invoiceNo }), { responseType: 'arraybuffer' });

// --- EXPENSES ---

export const createExpense = (data) => API.post(endpoints.expenses, data);
export const fetchExpenses = () => API.get(endpoints.expenses);
export const updateExpense = (id, data) => API.put(`${endpoints.expenses}/${id}`, data);
export const deleteExpense = (id) => API.delete(`${endpoints.expenses}/${id}`);

// --- BACKUP ---

export const exportBackup = () => API.post(endpoints.backup.export, {}, { responseType: 'blob' });

// --- PAYMENTS ---

export const recordDuePayment = (data) => API.post(endpoints.recordDuePayment, data);
export const recordDuePaymentsBatch = (data) => API.post('/api/payments/record-batch', data);
export const fetchPaymentHistory = (customerId, saleId, page = 0, size = 20) => {
  return API.get('/api/payments', {
    params: {
      customerId,
      page,
      size,
      ...(saleId ? { sourceType: 'SALE', sourceId: saleId } : {})
    },
  }).then((r) => r.data)
    .catch(err => {
      console.error("Payment Fetch Error:", err);
      return { content: [], totalElements: 0 };
    });
};
export const recordBulkPayment = (data) => API.post('/api/payments/bulk', data);
export const fetchCustomerAdvanceBalance = (customerId) => API.get(`/api/payments/customer/${customerId}/advance-balance`);

// --- CREDIT / DEBIT NOTES ---
// Both credit and debit notes follow the same "issue signed URL → download PDF" pattern
// as invoices and receipts. A credit note is auto-issued on every sales return; a
// debit note is auto-issued on every approved purchase return.
export const listCreditNotes = (page = 0, size = 20) =>
  API.get('/api/v1/credit-notes', { params: { page, size } }).then((r) => r.data);

export const getCreditNoteSignedUrl = (creditNoteId) =>
  API.get(`/api/v1/credit-notes/${creditNoteId}/signed-url`).then((r) => r.data);

export const applyCreditNote = (creditNoteId, amount) =>
  API.post(`/api/v1/credit-notes/${creditNoteId}/apply`, { amount }).then((r) => r.data);

// Returns [{ id, creditNoteNo, creditNoteDate, totalAmount, appliedAmount, status }]
export const findCreditNotesBySale = (saleId) =>
  API.get(`/api/v1/credit-notes/by-sale/${saleId}`).then((r) => r.data?.data ?? []);

export const listDebitNotes = (page = 0, size = 20) =>
  API.get('/api/v1/debit-notes', { params: { page, size } }).then((r) => r.data);

export const getDebitNoteSignedUrl = (debitNoteId) =>
  API.get(`/api/v1/debit-notes/${debitNoteId}/signed-url`).then((r) => r.data);

// Returns [{ id, debitNoteNo, debitNoteDate, totalAmount, appliedAmount, status }]
export const findDebitNotesByPurchaseReturn = (returnId) =>
  API.get(`/api/v1/debit-notes/by-purchase-return/${returnId}`).then((r) => r.data?.data ?? []);

// --- DELIVERY CHALLAN ---
// Returns a signed path like "/api/deliveries/challan/signed?token=..." valid
// for ~30 minutes. If the delivery has no challan number yet (legacy rows
// created before V66), one is lazy-assigned on the backend.
export const getDeliveryChallanSignedUrl = (deliveryId) =>
  API.get(`/api/deliveries/${deliveryId}/challan-signed-url`).then((r) => r.data);

// --- PROFORMA CONVERSION ---
// Turns a proforma sale into a real INVOICE sale (deducts stock, posts ledger,
// links back via proforma_source_sale_id). Backend rejects double conversion.
export const convertProformaToInvoice = (saleId) =>
  API.post(`/api/sales/${saleId}/convert-proforma-to-invoice`).then((r) => r.data);

// --- SALES ORDERS ---
export const createSalesOrder = (data) =>
  API.post('/api/sales-orders', data).then((r) => r.data);

export const updateSalesOrder = (id, data) =>
  API.put(`/api/sales-orders/${id}`, data).then((r) => r.data);

export const getSalesOrder = (id) =>
  API.get(`/api/sales-orders/${id}`).then((r) => r.data);

export const listSalesOrders = (page = 0, size = 20, status = null, customerId = null) => {
  const params = { page, size };
  if (status) params.status = status;
  if (customerId) params.customerId = customerId;
  return API.get('/api/sales-orders', { params }).then((r) => r.data);
};

export const approveSalesOrder = (id) =>
  API.post(`/api/sales-orders/${id}/approve`).then((r) => r.data);

export const cancelSalesOrder = (id) =>
  API.post(`/api/sales-orders/${id}/cancel`).then((r) => r.data);

// body: { lines: [{ salesOrderItemId, qty }] } — empty/null = full remaining
export const convertSalesOrderToSale = (id, body) =>
  API.post(`/api/sales-orders/${id}/convert-to-sale`, body || {}).then((r) => r.data);

export const createSalesOrderFromQuotation = (quotationId) =>
  API.post(`/api/sales-orders/from-quotation/${quotationId}`).then((r) => r.data);

export const getSalesOrderSignedUrl = (id) =>
  API.get(`/api/sales-orders/${id}/signed-url`).then((r) => r.data);

// --- QUOTATIONS ---
export const createQuotation = (data) =>
  API.post('/api/quotations', data).then((r) => r.data);

export const updateQuotation = (id, data) =>
  API.put(`/api/quotations/${id}`, data).then((r) => r.data);

export const getQuotation = (id) =>
  API.get(`/api/quotations/${id}`).then((r) => r.data);

export const listQuotations = (page = 0, size = 20, status = null, customerId = null) => {
  const params = { page, size };
  if (status) params.status = status;
  if (customerId) params.customerId = customerId;
  return API.get('/api/quotations', { params }).then((r) => r.data);
};

export const sendQuotation = (id) =>
  API.post(`/api/quotations/${id}/send`).then((r) => r.data);

export const acceptQuotation = (id) =>
  API.post(`/api/quotations/${id}/accept`).then((r) => r.data);

export const rejectQuotation = (id, reason) =>
  API.post(`/api/quotations/${id}/reject`, { reason }).then((r) => r.data);

export const cancelQuotation = (id) =>
  API.post(`/api/quotations/${id}/cancel`).then((r) => r.data);

export const convertQuotationToSale = (id) =>
  API.post(`/api/quotations/${id}/convert-to-sale`).then((r) => r.data);

export const getQuotationSignedUrl = (id) =>
  API.get(`/api/quotations/${id}/signed-url`).then((r) => r.data);

// --- REFUNDS ---
export const refundPayment = (paymentId, request) =>
  API.post(`/api/payments/${paymentId}/refund`, request).then((r) => r.data);

export const listRefundsForPayment = (paymentId) =>
  API.get(`/api/payments/${paymentId}/refunds`).then((r) => r.data);

export const getRefundSignedUrl = (refundId) =>
  API.get(`/api/refunds/${refundId}/signed-url`).then((r) => r.data);

// --- PAYMENT RECEIPTS ---
// Returns a signed path like "/api/receipts/signed?token=..." valid for ~30 minutes.
// The receipt is lazily created if this is the first request for the given payment.
export const getPaymentReceiptSignedUrl = (paymentId) =>
  API.get(`/api/payments/${paymentId}/receipt-signed-url`).then((r) => r.data);

// Downloads a receipt (or any signed PDF path) as a blob and triggers a browser download.
export const downloadReceiptPdf = async (signedPath, filename = 'receipt.pdf') => {
  const url = signedPath.includes('?')
    ? `${signedPath}&download=true`
    : `${signedPath}?download=true`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/pdf' },
  });
  if (!response.ok) {
    throw new Error(`Receipt download failed: HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
};

export const fetchProducts = () => API.get(endpoints.products);

// --- AUDIT LOGS ---

export const fetchAuditLogs = (params) =>
  API.get('/api/audit', { params }).then(res => res.data);
export const fetchAuditLogsByUser = (username) =>
  API.get(`/api/audit/user/${username}`).then(res => res.data);
export const exportAuditLogs = (params) =>
  API.get('/api/audit/export', {
    params,
    responseType: 'blob'
  });

// --- ANALYTICS ---

// Backend accepts optional { from, to } ISO-date strings and (for churn) { thresholdDays }.
// Every helper here forwards them as `params` — pass null/undefined to fall back to
// the backend's defaults (last 30 days for most, last 12 months for seasonal).
const rangeParams = ({ from, to } = {}) => ({
  ...(from ? { from } : {}),
  ...(to ? { to } : {}),
});

export const fetchRevenueLeakage = (opts = {}) =>
  API.get(endpoints.analytics.revenueLeakage, { params: { ...(opts.thresholdDays ? { thresholdDays: opts.thresholdDays } : {}) } });
export const fetchItemDemand = (opts = {}) =>
  API.get(endpoints.analytics.itemDemand, { params: { ...rangeParams(opts), ...(opts.itemId ? { itemId: opts.itemId } : {}) } });
export const fetchCustomerTrends = (opts = {}) =>
  API.get(endpoints.analytics.customerTrends, { params: { ...rangeParams(opts), ...(opts.customerId ? { customerId: opts.customerId } : {}) } });
export const fetchFuturePurchaseOrders = () => API.get(endpoints.analytics.futurePurchaseOrders);
export const fetchTopItems = (opts = {}) =>
  API.get(endpoints.analytics.topItems, { params: rangeParams(opts) });
export const fetchSeasonalTrends = (opts = {}) =>
  API.get(endpoints.analytics.seasonalTrends, { params: rangeParams(opts) });
export const fetchChurnPrediction = (opts = {}) =>
  API.get(endpoints.analytics.churnPrediction, { params: { ...(opts.thresholdDays ? { thresholdDays: opts.thresholdDays } : {}) } });
export const exportProcurementPlan = (format = 'xlsx') =>
  API.get(`${endpoints.analytics.exportProcurementPlan}?format=${format}`, { responseType: 'blob' });

// New 4.1 endpoints — accept { from, to, granularity }.
export const fetchKpis = (opts = {}) =>
  API.get(endpoints.analytics.kpis, { params: rangeParams(opts) });
export const fetchRevenueTimeSeries = (opts = {}) =>
  API.get(endpoints.analytics.revenueTimeseries, {
    params: { ...rangeParams(opts), ...(opts.granularity ? { granularity: opts.granularity } : {}) },
  });
export const fetchPaymentMix = (opts = {}) =>
  API.get(endpoints.analytics.paymentMix, { params: rangeParams(opts) });
export const fetchGrossMargin = (opts = {}) =>
  API.get(endpoints.analytics.grossMargin, { params: rangeParams(opts) });

// --- RECEIVING ---

export const fetchReceiving = () =>
  API.get(endpoints.receiving).then(r => r.data);
export const fetchReceivingById = (id) =>
  API.get(endpoints.receivingById(id)).then(r => r.data);
export const fetchReceivingByPoId = (poId) =>
  API.get(endpoints.receivingByPoId(poId)).then(r => r.data);
export const fetchReceivingByPoNumber = (poNumber) =>
  API.get(endpoints.receivingByPoNumber(poNumber)).then(r => r.data);
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
export const fetchAllTickets = () =>
  API.get(endpoints.fetchAllTicket).then(r => r.data);
export const initiateReceivingFromPO = (data) =>
  API.post(endpoints.receiveGoods, data).then(r => r.data);
export const addAttachmentToTicket = (data) =>
  API.post(`/api/tickets/${data.id}/attachments`);
export const updateReceivingTicket = (data) =>
  API.put(`/api/tickets/${data.id}`);
export const deleteReceivingTicket = (id) =>
  API.delete(`/api/tickets/${id}`);

// --- STAFF & PAYROLL ---

export const fetchStaff = (month, year, page = 0, size = 100) =>
  API.get(endpoints.staff, {
    params: { month, year, page, size }
  }).then(r => r.data);
export const addStaff = (data) =>
  API.post(endpoints.staff, data).then(r => r.data);
export const updateStaff = (id, data) =>
  API.put(`${endpoints.staff}/${id}`, data).then(r => r.data);
export const deleteStaff = (id) =>
  API.delete(`${endpoints.staff}/${id}`).then(r => r.data);
export const issueStaffAdvance = (id, amount, remarks) =>
  API.post(`${endpoints.staff}/${id}/advance`, null, {
    params: { amount, remarks }
  }).then(r => r.data);
export const processSalary = (payload) =>
  API.post(endpoints.payrollProcess, payload).then(r => r.data);
export const processBulkSalary = (payloadArray) =>
  API.post(endpoints.payrollBulk, payloadArray).then(r => r.data);
export const fetchStaffPaymentHistory = (staffId, page = 0, size = 10) =>
  API.get(`${endpoints.payrollHistory}/staff/${staffId}?page=${page}&size=${size}`).then(r => r.data);

// --- SUBSCRIPTIONS ---

export const startTrial = () =>
  API.post('/api/subscriptions/trial/start').then(res => res.data);
export const submitPaymentUtr = (paymentData) =>
  API.post('/api/subscriptions/verify-payment', paymentData).then(res => res.data);
export const fetchSubscriptionStatus = () =>
  API.get('/api/subscriptions/status').then(res => res.data);
export const fetchMyPaymentHistory = () =>
  API.get('/api/subscriptions/my-payments').then(res => res.data);
export const cancelSubscription = () =>
  API.post('/api/subscriptions/cancel').then(res => res.data);
export const downloadInvoice = (paymentId) => {
  return API.get(`/api/invoices/subscription/${paymentId}`, {
    responseType: 'blob',
  });
};

// --- PLATFORM ADMIN ACTIONS ---

export const fetchPendingVerifications = () =>
  API.get('/api/subscriptions/platform/pending').then(res => res.data);
export const approvePayment = (verificationId) =>
  API.post(`/api/subscriptions/platform/approve/${verificationId}`).then(res => res.data);
export const rejectPayment = (verificationId, reason) =>
  API.post(`/api/subscriptions/platform/reject/${verificationId}`, null, {
    params: { reason }
  }).then(res => res.data);
export const fetchPlatformStats = () =>
  API.get('/api/subscriptions/platform/stats').then(res => res.data);
export const fetchPlatformRevenueHistory = (days = 30) =>
  API.get('/api/subscriptions/platform/revenue-history', { params: { days } }).then(res => res.data);

export const fetchActivePricingPlans = () =>
  API.get('/api/pricing/active').then(res => res.data);

export const updatePlanConfig = (planDto) =>
  API.put('/api/pricing/admin/update', planDto).then(res => res.data);

export const fetchPlanDetailsByTier = (tier) =>
  API.get(`/api/pricing/admin/${tier}`).then(res => res.data);

// --- SUPPORT & CHAT ---

export const fetchMyChatHistory = () =>
  API.get('/api/support/history').then(res => res.data);
export const fetchShopHistoryForAdmin = (shopId) =>
  API.get(`/api/support/history/${shopId}`).then(res => res.data);
export const markChatAsRead = (shopId) =>
  API.post(`/api/support/mark-read/${shopId}`).then(res => res.data);
export const fetchAllConversations = () =>
  API.get('/api/support/admin/conversations').then(res => res.data);

// --- ADMIN SHOP MANAGEMENT ---

export const fetchGlobalShopSummary = (page = 0, size = 20, sort = 'createdAt,desc') =>
  API.get(`/api/admin/shops/summary?page=${page}&size=${size}&sort=${sort}`)
    .then(res => res.data);
export const toggleShopStatus = (shopId, active) =>
  API.patch(`/api/admin/shops/${shopId}/status?active=${active}`)
    .then(res => res.data);

export const fetchFileBlob = (path) => {
  return API.get(`/api/files/display`, {
    params: { path },
    responseType: 'blob',
  });
};

// --- RETAIL REPORTS ---

export const fetchExpiryReport = (days) =>
  API.get(endpoints.reports.expiryReport(days)).then(r => r.data);

export const fetchPurchaseRegister = (from, to) =>
  API.get(endpoints.reports.purchaseRegister(from, to)).then(r => r.data);

// --- USER MANAGEMENT ---

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

// --- NEWSLETTER SUBSCRIPTION ---

export const subscribeNewsletter = (email, source = 'FOOTER') =>
  API.post(endpoints.newsletter.subscribe, { email, source }).then(r => r.data);

export const fetchNewsletterSubscribers = (page = 0, size = 10, search = '', active = null, source = '') => {
  const params = { page, size };
  if (search) params.email = search;
  if (active !== null && active !== undefined && active !== '') params.active = active;
  if (source) params.source = source;
  return API.get(endpoints.newsletter.adminSubscribers, { params }).then(r => r.data);
};

export const fetchNewsletterStats = () =>
  API.get(endpoints.newsletter.adminStats).then(r => r.data);

export const exportNewsletterCsv = (search = '', active = null, source = '') => {
  const params = {};
  if (search) params.email = search;
  if (active !== null && active !== undefined && active !== '') params.active = active;
  if (source) params.source = source;
  return API.get(endpoints.newsletter.adminExport, { params, responseType: 'blob' });
};

// --- PURCHASE RETURNS & SUPPLIER LEDGER ---
export const fetchPurchaseReturns = (supplierId, page = 0, size = 10) => {
  const params = { page, size };
  if (supplierId) params.supplierId = supplierId;
  return API.get('/api/purchase-returns', { params }).then(r => r.data);
};

export const fetchPurchaseReturnById = (id) =>
  API.get(`/api/purchase-returns/${id}`).then(r => r.data);

export const createPurchaseReturn = (data) =>
  API.post('/api/purchase-returns', data).then(r => r.data);

export const approvePurchaseReturn = (id) =>
  API.post(`/api/purchase-returns/${id}/approve`).then(r => r.data);

export const cancelPurchaseReturn = (id) =>
  API.post(`/api/purchase-returns/${id}/cancel`).then(r => r.data);

export const fetchSupplierStatement = (supplierId, startDate, endDate) => {
  const params = { supplierId };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return API.get('/api/supplier-payments/statement', { params }).then(r => r.data);
};

// --- SUPPLIER PAYABLE BILLS (Issue 4) ---
export const getSupplierPayableBills = (supplierId) =>
  API.get('/api/supplier-payments/payable-bills', { params: { supplierId } }).then(r => r.data);

// --- E-INVOICE & E-WAY BILL (Issue 5) ---
export const generateEInvoice = (saleId) =>
  API.post(`/api/v1/einvoice/generate/${saleId}`).then(r => r.data?.data || r.data);

export const cancelEInvoice = (saleId, reason = 'Cancelled via portal') =>
  API.post(`/api/v1/einvoice/cancel/${saleId}`, null, { params: { reason } }).then(r => r.data?.data || r.data);

export const generateEWayBill = (payload) =>
  API.post('/api/v1/ewaybill/generate', payload).then(r => r.data?.data || r.data);

export const fetchEWayBillThreshold = () =>
  API.get('/api/v1/ewaybill/threshold').then(r => r.data?.data || r.data);


// --- ACCOUNTING CONTROLLER ---
export const fetchProfitAndLoss = (startDate, endDate) =>
  API.get('/api/v1/accounting/pnl', { params: { startDate, endDate } }).then(r => r.data?.data || r.data);

export const fetchReceivablesAging = () =>
  API.get('/api/v1/accounting/receivables-aging').then(r => r.data?.data || r.data);

export const fetchPayablesAging = () =>
  API.get('/api/v1/accounting/payables-aging').then(r => r.data?.data || r.data);

export default API;

