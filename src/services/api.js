import axios from 'axios';
import endpoints from './endpoints';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getValidToken, clearAuthStorage } from '../utils/authStorage';
import { captureException } from './sentry';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

// ── AbortController registry ──────────────────────────────────────────────────
// Tracks in-flight requests by a caller-supplied requestId so individual
// requests (or all of them at once) can be cancelled from outside the module.
const requestControllers = new Map();

/**
 * Cancel a single in-flight request by the id used when it was registered.
 * Safe to call even when no request with that id is active.
 */
export const cancelRequest = (requestId) => {
  const controller = requestControllers.get(requestId);
  if (controller) {
    controller.abort();
    requestControllers.delete(requestId);
  }
};

/**
 * Cancel every tracked in-flight request (e.g. on logout or hard navigation).
 */
export const cancelAllRequests = () => {
  requestControllers.forEach((controller) => controller.abort());
  requestControllers.clear();
};

export const getRequest = (url, config) => API.get(url, config);

export let isRefreshing = false;
export let failedQueue = [];

// ── Error notification deduplication ──────────────────────────────────────
// Prevents multiple identical error toasts from appearing simultaneously
let lastErrorToastTime = 0;
let lastErrorMessage = '';
const ERROR_TOAST_DEBOUNCE_MS = 3000; // Only show same error once per 3s

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

// --- RETRY STRATEGY WITH EXPONENTIAL BACKOFF ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const shouldRetry = (error, retryCount) => {
  // Don't retry if max retries exceeded
  if (retryCount >= MAX_RETRIES) return false;

  // Retry on network errors (no status)
  if (!error.response) return true;

  const status = error.response.status;
  // Retry on 5xx server errors and 503 Service Unavailable
  if (status >= 500) return true;

  // Don't retry on client errors (4xx) except 408 Request Timeout
  if (status === 408) return true;

  return false;
};

const getRetryDelay = (retryCount) => {
  // Exponential backoff: 1s, 2s, 4s
  return INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
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
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params ?? '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR WITH RETRY ---
API.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(
        `[API] ${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`,
      );
    }
    return response;
  },
  async (error) => {
    // Swallow cancellations — the component that triggered the abort already
    // knows it unmounted/navigated away; propagating the error would cause
    // "Can't perform a React state update on an unmounted component" warnings.
    if (axios.isCancel(error)) {
      return Promise.reject(error); // re-throw so callers can still detect it
    }

    const config = error.config;
    const retryCount = config.__retryCount || 0;

    // Attempt retry with exponential backoff for retryable errors
    if (shouldRetry(error, retryCount)) {
      config.__retryCount = retryCount + 1;
      const delayMs = getRetryDelay(retryCount);

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug(`[API] Retrying ${config.method?.toUpperCase()} ${config.url} in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Retry the request
      return API(config);
    }

    const status = error.response?.status;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        `[API Error] ${status ?? 'network'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.message,
      );
    }

    if (status === 401 || status === 403) {
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      clearAuthStorage();
      if (!isLoginRequest && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    // Capture unexpected server errors (5xx) and network failures to Sentry.
    // Auth errors (401/403) and client validation errors (4xx) are expected
    // flows and are intentionally excluded.
    // Note: No global error toast shown — components use ErrorState for professional error pages
    const isServerError = !status || status >= 500;
    if (isServerError) {
      captureException(error, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: status ?? 'network_error',
        baseURL: error.config?.baseURL,
      });
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

// --- Email verification ---

export const verifyEmail = (token) =>
  API.post(endpoints.auth.verifyEmail, { token }, { skipAuthRefresh: true });

export const resendVerification = (email) =>
  API.post(endpoints.auth.resendVerification, { email }, { skipAuthRefresh: true });

// --- MFA (TOTP) ---

/** Returns { enabled: boolean, remainingBackupCodes: number }. */
export const fetchMfaStatus = () => API.get(endpoints.auth.mfaStatus);

/** Kicks off enrollment — returns { secret, otpAuthUri, qrDataUrl }. */
export const initMfaSetup = () => API.post(endpoints.auth.mfaSetupInit);

/** Confirms enrollment with the first 6-digit code — returns { enabled, backupCodes[] }. */
export const confirmMfaSetup = (code) =>
  API.post(endpoints.auth.mfaSetupConfirm, { code });

/** Regenerates the backup-code batch. Requires a current TOTP code. */
export const regenerateBackupCodes = (code) =>
  API.post(endpoints.auth.mfaRegenerateCodes, { code });

/** Disables MFA. Requires a current TOTP or backup code. */
export const disableMfa = (code) =>
  API.post(endpoints.auth.mfaDisable, { code });

/**
 * Exchanges an MFA challenge token + verification code for a real access token
 * + refresh cookie. Used only on the login flow between the password step
 * and the authenticated session.
 */
export const verifyMfaChallenge = (challengeToken, code) =>
  API.post(endpoints.auth.mfaVerify, { challengeToken, code }, { skipAuthRefresh: true });

// --- RBAC + multi-shop context (Phase 5) ---

/** List every shop the current user belongs to (for the shop switcher). */
export const fetchMyShops = () => API.get(endpoints.auth.myShops);

/** Effective permission codes for the current user in the active shop. */
export const fetchMyPermissions = () => API.get(endpoints.auth.myPermissions);

/** Switch active shop — returns a fresh access token to swap in. */
export const switchShop = (shopId) => API.post(endpoints.auth.switchShop, { shopId });

// --- Active Sessions (Phase 6) ---

/** List every active session for the current user (browser/device rows). */
export const fetchMySessions = () => API.get(endpoints.auth.sessions);

/** Revoke a specific session by sid. */
export const revokeSession = (sessionId) =>
  API.delete(endpoints.auth.sessionById(sessionId));

/** Revoke every session except this one — the "Sign out everywhere else" action. */
export const revokeAllOtherSessions = () =>
  API.post(endpoints.auth.sessionsRevokeAllExceptCurrent);

/** Canonical permission catalogue (grouped by module). */
export const fetchRbacPermissions = () => API.get(endpoints.rbac.permissions);

/** All roles seeded / created for the current shop. */
export const fetchRbacRoles = () => API.get(endpoints.rbac.roles);

// --- Shop staff invitations ---

export const listShopInvitations = () => API.get(endpoints.shopInvitations);

export const createShopInvitation = (payload) => API.post(endpoints.shopInvitations, payload);

export const revokeShopInvitation = (id) => API.delete(endpoints.shopInvitationById(id));

/** Public — no auth required. Preview an invitation before accepting. */
export const lookupShopInvitation = (token) =>
  API.get(endpoints.shopInvitationLookup, { params: { token }, skipAuthRefresh: true });

/** Public — no auth required. Accepts the invitation and auto-logs the invitee in. */
export const acceptShopInvitation = (payload) =>
  API.post(endpoints.shopInvitationAccept, payload, { skipAuthRefresh: true });

// --- Custom role management ---

export const createRbacRole = (payload) => API.post(endpoints.rbac.roles, payload);
export const updateRbacRole = (id, payload) => API.put(endpoints.rbac.roleById(id), payload);
export const deleteRbacRole = (id) => API.delete(endpoints.rbac.roleById(id));

// --- Shop members ---

export const listShopMembers = () => API.get(endpoints.shopMembers);
export const changeShopMemberRole = (userId, roleName) =>
  API.patch(endpoints.shopMemberRole(userId), { roleName });
export const setShopMemberStatus = (userId, active) =>
  API.patch(endpoints.shopMemberStatus(userId), { active });
export const removeShopMember = (userId) =>
  API.delete(endpoints.shopMemberById(userId));

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

export const fetchIndustryConfig = (industryType) => {
  const type = (industryType || 'GENERAL').toUpperCase();
  return API.get(endpoints.configIndustryFields(type));
};

/**
 * Fetches the server-authoritative list of enabled industry types.
 * The FE used to hard-code the list — this call means adding a new
 * IndustryType server-side automatically becomes selectable without a
 * frontend redeploy.
 */
export const fetchIndustries = () => API.get(endpoints.configIndustries);

// Per-shop custom attribute definitions (Phase 4)
export const fetchCustomAttributes = () => API.get(endpoints.customAttributes);
export const createCustomAttribute = (payload) => API.post(endpoints.customAttributes, payload);
export const updateCustomAttribute = (id, payload) => API.put(endpoints.customAttributeById(id), payload);
export const deleteCustomAttribute = (id) => API.delete(endpoints.customAttributeById(id));
export const reorderCustomAttributes = (ids) => API.post(endpoints.customAttributeReorder, { ids });

/**
 * Applies a partial patch (threshold, reorder rules, preferred supplier)
 * to every variant in `ids`. Used by the LowStockAlerts "Bulk edit" flow.
 */
export const bulkPatchItemVariants = (payload) =>
  API.post('/api/item-variants/bulk-patch', payload);

export const fetchShop = async (signal) => {
  try {
    const res = await API.get(endpoints.shop, signal ? { signal } : undefined);
    if (res.status === 204 || res.status === 404) {
      return { data: null, status: res.status };
    }
    return res;
  } catch (err) {
    if (axios.isCancel(err)) return null;
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

// --- SHOP BANK ACCOUNTS ---
// Structured replacement for the legacy free-text `bank_details` blob.
// One default per currency; the default flows into invoice PDFs.

export const listShopBankAccounts = () =>
  API.get(endpoints.shopBankAccounts).then((r) => r.data);

export const createShopBankAccount = (data) =>
  API.post(endpoints.shopBankAccounts, data).then((r) => r.data);

export const updateShopBankAccount = (id, data) =>
  API.put(endpoints.shopBankAccountById(id), data).then((r) => r.data);

export const deleteShopBankAccount = (id) =>
  API.delete(endpoints.shopBankAccountById(id));

export const setDefaultShopBankAccount = (id) =>
  API.post(endpoints.shopBankAccountDefault(id)).then((r) => r.data);

// --- PURCHASE ORDERS ---

export const getPurchaseOrders = (signal) =>
  API.get(endpoints.purchaseOrders, signal ? { signal } : undefined).then((r) => r.data);

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

// V81 state-machine actions — new endpoints backed by PurchaseOrderService.
// cancelPurchaseOrder requires a written reason (server-side @NotBlank, 500-char cap).
export const cancelPurchaseOrder = (id, reason) =>
  API.post(endpoints.cancelPurchaseOrder(id), { reason }).then((r) => r.data);

// V86 (Phase 5): body is optional — omitting it uses server defaults
// (supplier.email, generated subject + body, PDF attached).
// Supply { to, subject, body, attachPdf } to override any of those.
export const sendPurchaseOrder = (id, body = null) =>
  API.post(endpoints.sendPurchaseOrder(id), body || undefined).then((r) => r.data);

// V86 attachments — file bytes go through the backend's FileStorageService.
export const listPurchaseOrderAttachments = (id) =>
  API.get(endpoints.purchaseOrderAttachments(id)).then((r) => r.data);

export const uploadPurchaseOrderAttachment = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(endpoints.purchaseOrderAttachments(id), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const deletePurchaseOrderAttachment = (poId, attachmentId) =>
  API.delete(endpoints.purchaseOrderAttachmentById(poId, attachmentId)).then((r) => r.data);

export const markReceivedPurchaseOrder = (id) =>
  API.post(endpoints.markReceivedPurchaseOrder(id)).then((r) => r.data);

// Clone an existing PO into a fresh DRAFT (Phase 2 UX add). BE assigns a new
// PO number, resets lifecycle stamps, and carries over supplier + line items.
export const duplicatePurchaseOrder = (id) =>
  API.post(endpoints.duplicatePurchaseOrder(id)).then((r) => r.data);

// Returns a signed URL (e.g. "/api/purchase-orders/signed?token=…") that
// serves the PO PDF for ~30 minutes. Follows the invoice / quotation pattern.
export const getPurchaseOrderSignedUrl = (id) =>
  API.get(endpoints.purchaseOrderSignedUrl(id)).then((r) => r.data);

// V85 approval workflow — powers the /purchase-orders/approvals queue and the
// Approve / Reject buttons on the PO detail page. Reject requires a reason;
// server @NotBlank / @Size(500) validation.
export const getPendingApprovalPurchaseOrders = () =>
  API.get(endpoints.pendingApprovalPurchaseOrders).then((r) => r.data);

export const approvePurchaseOrder = (id) =>
  API.post(endpoints.approvePurchaseOrder(id)).then((r) => r.data);

export const rejectPurchaseOrder = (id, reason) =>
  API.post(endpoints.rejectPurchaseOrder(id), { reason }).then((r) => r.data);

// Refactor: REJECTED → DRAFT so the requester can edit + resubmit. Server
// preserves rejectionReason on the row so the FE keeps the reference banner
// visible during revision.
export const revisePurchaseOrder = (id) =>
  API.post(endpoints.revisePurchaseOrder(id)).then((r) => r.data);

// New "open" alias — /pending stays for backward compat but /open is the
// canonical Zoho-parity name and only returns SUBMITTED + PARTIALLY_RECEIVED.
export const getOpenPurchaseOrders = () =>
  API.get(endpoints.openPurchaseOrders).then((r) => r.data);

// --- SUPPLIERS ---

export const getSuppliers = (signal) =>
  API.get(endpoints.suppliers, signal ? { signal } : undefined).then((r) => r.data);

export const createSupplier = (data) =>
  API.post(endpoints.suppliers, data).then((r) => r.data);

export const updateSupplier = (id, data) =>
  API.put(endpoints.supplierById(id), data).then((r) => r.data);

export const deleteSupplier = (id) =>
  API.delete(endpoints.supplierById(id)).then((r) => r.data);

export const getSupplierById = (id) =>
  API.get(endpoints.supplierById(id)).then((r) => r.data);

// V103 — aggregate stats for the enterprise supplier detail KPI strip.
export const getSupplierStats = (id) =>
  API.get(`/api/suppliers/${id}/stats`).then((r) => r.data);

// V103 — soft on/off toggle (never hard-delete a supplier with history).
export const toggleSupplierActive = (id) =>
  API.post(`/api/suppliers/${id}/toggle-active`).then((r) => r.data);

/**
 * Bulk activate or deactivate a list of suppliers.
 * active=true → activate all; active=false → deactivate all.
 */
export const bulkToggleSupplierActive = (ids, active) =>
  API.post('/api/suppliers/bulk-toggle-active', { ids, active }).then((r) => r.data);

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
export const fetchItems = (signal) => API.get(endpoints.items, signal ? { signal } : undefined);
export const getItemById = (id) => API.get(endpoints.getItemById(id));
export const updateItem = (id, data) => API.put(endpoints.updateItem(id), data);
export const fetchCategories = (signal) => API.get(endpoints.fetchCategories, signal ? { signal } : undefined);
export const createCategory = (payload) => API.post(endpoints.fetchCategories, payload);
export const updateCategory = (id, payload) => API.put(endpoints.categoryById(id), payload);
export const deleteCategory = (id) => API.delete(endpoints.categoryById(id));
export const fetchItemSubstitutes = (itemId) => API.get(`${endpoints.items}/${itemId}/substitutes`);

export const createItemVariant = (data) => API.post(endpoints.createItemVariant, data)
export const deleteItemVariant = (id) => API.delete(endpoints.deleteItemVariant(id));
export const deleteItemsBulk = (ids) => API.delete(endpoints.deleteItemsBulk, { data: { ids } });

/**
 * Apply a price multiplier to every variant of the selected items.
 * factor > 1 increases prices; factor < 1 reduces them.
 * e.g. factor=1.1 → 10% increase, factor=0.9 → 10% reduction
 */
export const bulkApplyItemPriceFactor = (ids, factor) =>
  API.post('/api/items/bulk-price-factor', { ids, factor }).then((r) => r.data);

/**
 * Reassign all selected items to the given category.
 */
export const bulkAssignItemCategory = (ids, categoryId) =>
  API.post('/api/items/bulk-assign-category', { ids, categoryId }).then((r) => r.data);
export const searchItemsPage = (params, signal) => API.get(endpoints.searchItems, signal ? { params, signal } : { params });
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
export const fetchStock = (signal) => API.get(endpoints.fetchStock, signal ? { signal } : undefined);
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

/**
 * Legacy customer list — kept for callers that use it as a picker
 * source (invoice creation, dashboard widget). Under the hood it now
 * hits the paged endpoint with a hard 500-row cap so a tenant with
 * 50k customers can't OOM the browser tab.
 *
 * <p>Response is wrapped to look exactly like the old unpaged
 * `GET /api/customers` (an array under `data`) — so every caller
 * continues to work without a change.</p>
 *
 * <p>New callers should use {@link fetchCustomersPaged} directly and
 * do their own server-side filtering / pagination.</p>
 */
export const fetchCustomers = async (signal) => {
  const page = await API.get('/api/customers/paged', {
    params: { size: 500 },
    ...(signal ? { signal } : {}),
  });
  const body = page?.data || {};
  const list = Array.isArray(body.content) ? body.content : [];
  if (typeof body.totalElements === 'number' && body.totalElements > list.length) {
    // Not a hard error — just a heads-up so we can find and migrate
    // legacy callers over time.
    // eslint-disable-next-line no-console
    console.warn(
      `[fetchCustomers] Legacy unpaged call: ${body.totalElements} customers exist but only ${list.length} returned. Migrate this caller to fetchCustomersPaged.`,
    );
  }
  return { data: list };
};
export const createCustomer = (data) => API.post(endpoints.customers, data);
export const updateCustomer = (id, data) => API.put(`${endpoints.customers}/${id}`, data);
export const fetchCustomer = (id, data) => API.get(`${endpoints.customers}/${id}`, data);
export const deleteCustomer = (id) => API.delete(`${endpoints.customers}/${id}`);
export const archiveCustomer = (id) => API.post(`/api/customers/${id}/archive`).then((r) => r.data);

export const fetchCustomerLedger = (id, params = {}) => {
  return API.get(`/api/customers/${id}/ledger`, { params });
};
/** Returns CustomerStatsDto — total sales, AOV, outstanding, credit notes, payments, advance, quotes, SOs. */
export const getCustomerStats = (id) =>
  API.get(`/api/customers/${id}/stats`).then((r) => r.data);
/** Flips the customer's active flag. OWNER/ADMIN only. Returns updated CustomerDto. */
export const toggleCustomerActive = (id) =>
  API.post(`/api/customers/${id}/toggle-active`).then((r) => r.data);

// Enterprise Customer Endpoints (V105)
export const fetchCustomersPaged = (params = {}, signal) =>
  API.get('/api/customers/paged', signal ? { params, signal } : { params }).then((r) => r.data);

export const fetchCustomerKpis = (signal) =>
  API.get('/api/customers/kpis', signal ? { signal } : undefined).then((r) => r.data);

export const bulkToggleCustomerActive = (ids, active) =>
  API.post('/api/customers/bulk-toggle-active', { ids, active }).then((r) => r.data);

export const bulkDeleteCustomers = (ids) =>
  API.post('/api/customers/bulk-delete', { ids }).then((r) => r.data);

/**
 * Append one or more tags to all selected customers.
 * tags is a comma-separated string, e.g. "VIP,Wholesale".
 */
export const bulkTagCustomers = (ids, tags) =>
  API.post('/api/customers/bulk-tag', { ids, tags }).then((r) => r.data);

export const exportCustomersCsv = () =>
  API.get('/api/customers/export.csv', { responseType: 'blob' });

export const importCustomersCsv = (formData) =>
  API.post('/api/customers/import.csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const fetchCustomerTransactions = (customerId, page = 0, size = 20) =>
  API.get(`/api/customers/${customerId}/transactions`, { params: { page, size } }).then((r) => r.data);

export const fetchCustomerAudit = (customerId) =>
  API.get(`/api/customers/${customerId}/audit`).then((r) => r.data);

export const fetchCustomerCreditNotes = (customerId, page = 0, size = 20) =>
  API.get(`/api/customers/${customerId}/credit-notes`, { params: { page, size } }).then((r) => r.data);

export const fetchCustomerPayments = (customerId, page = 0, size = 20) =>
  API.get(`/api/customers/${customerId}/payments`, { params: { page, size } }).then((r) => r.data);

export const fetchCustomerQuotations = (customerId, page = 0, size = 20) =>
  API.get(`/api/customers/${customerId}/quotations`, { params: { page, size } }).then((r) => r.data);

export const fetchCustomerSalesOrders = (customerId, page = 0, size = 20) =>
  API.get(`/api/customers/${customerId}/sales-orders`, { params: { page, size } }).then((r) => r.data);

export const sendCustomerStatementEmail = (customerId, data) =>
  API.post(`/api/customers/${customerId}/statement/email`, data).then((r) => r.data);

/**
 * @deprecated Use {@link downloadCustomerStatementPdf} instead.
 *
 * Returns the raw endpoint path — but opening this via `window.open`
 * doesn't work: the browser fetch of a new tab can't attach the
 * Authorization header, so the endpoint responds 401 and the user
 * sees the raw URL in the address bar with no PDF. Left here only
 * so any lingering caller still resolves.
 */
export const getCustomerStatementPdfUrl = (customerId, from, to) => {
  const query = [];
  if (from) query.push(`from=${from}`);
  if (to) query.push(`to=${to}`);
  const qStr = query.length > 0 ? `?${query.join('&')}` : '';
  return `/api/customers/${customerId}/statement/pdf${qStr}`;
};

/**
 * Fetches the customer statement PDF as an authenticated blob and
 * triggers a browser download via a programmatic anchor click.
 *
 * <p>We deliberately do NOT use {@code window.open(blobUrl, '_blank')}
 * — a popup blocker can silently swallow it and (worse) some browsers
 * follow up by navigating the CURRENT tab to the blob URL, so the
 * user sees the PDF replace the page they were on. The anchor +
 * download attribute pattern side-steps both: the current page never
 * moves, and even blocked popups don't turn into navigations.</p>
 *
 * <p>Uses the axios instance so the JWT Authorization header + tenant
 * cookies travel with the request; a raw `window.open` on the path
 * can't send those and would 401.</p>
 */
export const downloadCustomerStatementPdf = async (customerId, from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await API.get(`/api/customers/${customerId}/statement/pdf`, {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const filename = `Customer_${customerId}_Statement${from ? `_${from}` : ''}${to ? `_${to}` : ''}.pdf`;
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the blob URL a minute later — long enough for the browser
  // to have finished the download, short enough not to leak.
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
};

// ─── V115 enterprise Customer helpers ────────────────────────────────

/** Live duplicate lookup for the customer create/edit form. */
export const findCustomerDuplicates = (params) =>
  API.get('/api/customers/duplicates', { params }).then((r) => r.data);

/** 7th sub-resource — delivery challans for a customer. */
export const fetchCustomerDeliveryChallans = (customerId, page = 0, size = 20) =>
  API.get(`/api/customers/${customerId}/delivery-challans`, { params: { page, size } }).then((r) => r.data);

// ── Customer Contacts ─────────────────────────────────────────────
export const fetchCustomerContacts = (customerId) =>
  API.get(`/api/customers/${customerId}/contacts`).then((r) => r.data);
export const createCustomerContact = (customerId, data) =>
  API.post(`/api/customers/${customerId}/contacts`, data).then((r) => r.data);
export const updateCustomerContact = (customerId, contactId, data) =>
  API.put(`/api/customers/${customerId}/contacts/${contactId}`, data).then((r) => r.data);
export const deleteCustomerContact = (customerId, contactId) =>
  API.delete(`/api/customers/${customerId}/contacts/${contactId}`).then((r) => r.data);
export const setPrimaryCustomerContact = (customerId, contactId) =>
  API.post(`/api/customers/${customerId}/contacts/${contactId}/set-primary`).then((r) => r.data);

// ── Customer Addresses ────────────────────────────────────────────
export const fetchCustomerAddresses = (customerId) =>
  API.get(`/api/customers/${customerId}/addresses`).then((r) => r.data);
export const createCustomerAddress = (customerId, data) =>
  API.post(`/api/customers/${customerId}/addresses`, data).then((r) => r.data);
export const updateCustomerAddress = (customerId, addressId, data) =>
  API.put(`/api/customers/${customerId}/addresses/${addressId}`, data).then((r) => r.data);
export const deleteCustomerAddress = (customerId, addressId) =>
  API.delete(`/api/customers/${customerId}/addresses/${addressId}`).then((r) => r.data);
export const setDefaultBillingAddress = (customerId, addressId) =>
  API.post(`/api/customers/${customerId}/addresses/${addressId}/set-default-billing`).then((r) => r.data);
export const setDefaultShippingAddress = (customerId, addressId) =>
  API.post(`/api/customers/${customerId}/addresses/${addressId}/set-default-shipping`).then((r) => r.data);

// ── Customer Notes ────────────────────────────────────────────────
export const fetchCustomerNotes = (customerId) =>
  API.get(`/api/customers/${customerId}/notes`).then((r) => r.data);
export const createCustomerNote = (customerId, data) =>
  API.post(`/api/customers/${customerId}/notes`, data).then((r) => r.data);
export const updateCustomerNote = (customerId, noteId, data) =>
  API.put(`/api/customers/${customerId}/notes/${noteId}`, data).then((r) => r.data);
export const deleteCustomerNote = (customerId, noteId) =>
  API.delete(`/api/customers/${customerId}/notes/${noteId}`).then((r) => r.data);
export const pinCustomerNote = (customerId, noteId, pinned = true) =>
  API.post(`/api/customers/${customerId}/notes/${noteId}/pin`, { pinned }).then((r) => r.data);

// ── Customer Segments (shop-wide catalogue) ───────────────────────
export const fetchCustomerSegments = () =>
  API.get('/api/customer-segments').then((r) => r.data);
export const createCustomerSegment = (data) =>
  API.post('/api/customer-segments', data).then((r) => r.data);
export const updateCustomerSegment = (segmentId, data) =>
  API.put(`/api/customer-segments/${segmentId}`, data).then((r) => r.data);
export const deleteCustomerSegment = (segmentId) =>
  API.delete(`/api/customer-segments/${segmentId}`).then((r) => r.data);

// ── Customer ↔ Segment membership ─────────────────────────────────
export const fetchSegmentsForCustomer = (customerId) =>
  API.get(`/api/customers/${customerId}/segments`).then((r) => r.data);
export const attachCustomerToSegment = (customerId, segmentId) =>
  API.post(`/api/customers/${customerId}/segments/${segmentId}`).then((r) => r.data);
export const detachCustomerFromSegment = (customerId, segmentId) =>
  API.delete(`/api/customers/${customerId}/segments/${segmentId}`).then((r) => r.data);
export const replaceCustomerSegments = (customerId, segmentIds) =>
  API.put(`/api/customers/${customerId}/segments`, { segmentIds }).then((r) => r.data);

// ── Customer Attachments ─────────────────────────────────────────
export const fetchCustomerAttachments = (customerId) =>
  API.get(`/api/customers/${customerId}/attachments`).then((r) => r.data);

export const uploadCustomerAttachment = (customerId, file, category) => {
  const fd = new FormData();
  fd.append('file', file);
  if (category) fd.append('category', category);
  return API.post(`/api/customers/${customerId}/attachments`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const deleteCustomerAttachment = (customerId, attachmentId) =>
  API.delete(`/api/customers/${customerId}/attachments/${attachmentId}`).then((r) => r.data);

/**
 * Download an attachment as a blob and trigger a browser download.
 * Same anchor+download pattern as the statement PDF helper — the
 * axios call sends the auth header, then we hand the browser a blob
 * URL through a hidden anchor click so the current tab never moves.
 */
export const downloadCustomerAttachment = async (customerId, attachmentId, fileName) => {
  const res = await API.get(`/api/customers/${customerId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `attachment_${attachmentId}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};

// ── Customer Custom Fields ────────────────────────────────────────
export const fetchCustomerCustomFields = (customerId) =>
  API.get(`/api/customers/${customerId}/custom-fields`).then((r) => r.data);

export const upsertCustomerCustomField = (customerId, fieldKey, fieldValue) =>
  API.put(`/api/customers/${customerId}/custom-fields/${encodeURIComponent(fieldKey)}`, {
    fieldKey,
    fieldValue,
  }).then((r) => r.data);

export const deleteCustomerCustomField = (customerId, fieldKey) =>
  API.delete(`/api/customers/${customerId}/custom-fields/${encodeURIComponent(fieldKey)}`).then((r) => r.data);

export const bulkSaveCustomerCustomFields = (customerId, values) =>
  API.put(`/api/customers/${customerId}/custom-fields`, values).then((r) => r.data);

// ── Merge customers ──────────────────────────────────────────────
export const mergeCustomers = (sourceId, targetId) =>
  API.post('/api/customers/merge', { sourceId, targetId }).then((r) => r.data);



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

// ── OFFLINE SALES API ──────────────────────────────────────────────────────────
/**
 * Enqueue an offline sale to be processed when app comes online
 * Returns: { id, clientTxnId, status, offlineSaleNo, saleId, invoiceNumber, ... }
 */
export const enqueueOfflineSale = (offlineSaleRequest) => {
  return API.post('/api/sales/offline-queue', offlineSaleRequest);
};

/**
 * Get status of a queued offline sale
 * Polls to check if sale has been processed (COMPLETED) or if it failed
 */
export const getOfflineSaleStatus = (clientTxnId) => {
  return API.get(`/api/sales/offline-queue/${clientTxnId}`);
};

/**
 * Get pending count for UI badge
 * Shows how many offline sales are queued or being processed
 */
export const getOfflinePendingCount = (shopId) => {
  return API.get(`/api/sales/offline-queue/shop/${shopId}/pending`);
};

/**
 * List all pending/failed/draft offline sales for a shop from the server DB.
 * Complements the local IndexedDB view — useful when the device has been
 * offline and then comes back online.
 * @param {number} shopId
 * @param {string} [statuses] - comma-separated, e.g. "DRAFT,PENDING,FAILED" (default when omitted)
 */
export const getOfflineQueueList = (shopId, statuses) => {
  const params = { shopId };
  if (statuses) params.statuses = statuses;
  return API.get('/api/sales/offline-queue', { params });
};

/**
 * Manually trigger processing of offline sales
 * Called when app comes online
 */
export const triggerOfflineProcessing = (shopId) => {
  return API.post(`/api/sales/offline-queue/shop/${shopId}/process`, {});
};

/**
 * Get offline sales processing statistics
 * Returns: { pending, failed, conflicted, total }
 */
export const getOfflineStats = (shopId) => {
  return API.get(`/api/sales/offline-queue/shop/${shopId}/stats`);
};

/**
 * Get conflicted offline sales for admin review
 */
export const getOfflineConflictedSales = (shopId) => {
  return API.get(`/api/sales/offline-queue/shop/${shopId}/conflicted`);
};

/**
 * Retry a failed/conflicted offline sale
 */
export const retryOfflineSale = (queueId) => {
  return API.post(`/api/sales/offline-queue/${queueId}/retry`, {});
};

/**
 * Override a conflicted sale (link to existing sale ID)
 */
export const overrideConflict = (queueId, data) => {
  return API.post(`/api/sales/offline-queue/${queueId}/override`, data);
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
export const fetchAllSales = (from, to, signal) => {
  const cfg = signal ? { signal } : undefined;
  if (from && to) {
    return API.get(endpoints.salesByDateRange(from, to), cfg);
  }
  return API.get(endpoints.sales, cfg);
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

export const fetchDailyReport = (date, signal) =>
  API.get(endpoints.reports.daily(date), signal ? { signal } : undefined);
export const fetchSalesSummary = (from, to, signal) => {
  const cfg = signal ? { signal } : undefined;
  if (from && to) {
    return API.get(endpoints.reports.salesSummary(from, to), cfg);
  }
  return API.get(endpoints.reports.salesSummary(), cfg);
};
export const fetchGstSummary = (from, to) =>
  API.get(endpoints.reports.gstSummary(from, to));
export const fetchGstBreakdown = (from, to) =>
  API.get(endpoints.reports.gstBreakdown(from, to));
// Used by useOfflineSales to pre-cache GST states for offline place-of-supply selection.
export const fetchGstReferenceData = () =>
  API.get('/api/v1/gst/reference/states', { suppressErrorToast: true });
export const fetchItemsSold = (from, to, signal) => {
  const cfg = signal ? { signal } : undefined;
  if (from && to) {
    return API.get(endpoints.reports.itemsSold(from, to), cfg);
  }
  return API.get(endpoints.reports.itemsSold(), cfg);
};
export const fetchCategorySales = (from, to, signal) => {
  const cfg = signal ? { signal } : undefined;
  if (from && to) {
    return API.get(endpoints.reports.categorySales(from, to), cfg);
  }
  return API.get(endpoints.reports.categorySales(), cfg);
};
export const fetchCustomerSales = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.customerSales(from, to));
  }
  return API.get(endpoints.reports.customerSales());
};
export const fetchSalespersonLeaderboard = (from, to) => {
  if (from && to) {
    return API.get(endpoints.reports.salespersonLeaderboard(from, to));
  }
  return API.get(endpoints.reports.salespersonLeaderboard());
};
export const fetchZReport = (date) =>
  API.get(endpoints.reports.zReport(date));
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

/**
 * Legacy fetch — kept for backward-compatible callers.
 * New code should prefer fetchPaymentsFiltered which supports the full
 * filter set used by usePaymentFilters / AdvancedPaymentFilter.
 */
export const fetchPaymentHistory = (customerId, saleId, page = 0, size = 20, filters = {}) => {
  const { startDate, endDate, methods, status, search } = filters;
  return API.get('/api/payments', {
    params: {
      customerId,
      page,
      size,
      ...(saleId ? { sourceType: 'SALE', sourceId: saleId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate   ? { endDate }   : {}),
      ...(methods?.length ? { methods: methods.join(',') } : {}),
      ...(status?.length  ? { status:  status.join(',')  } : {}),
      ...(search          ? { search }                      : {}),
    },
  }).then((r) => r.data)
    .catch(err => {
      console.error('Payment Fetch Error:', err);
      return { content: [], totalElements: 0 };
    });
};

/**
 * Paginated, filtered payment history for a customer.
 * Used by usePaymentFilters hook.
 *
 * @param {string|number} customerId
 * @param {object}        filters    — { startDate, endDate, methods[], status[], search }
 * @param {number}        page       — 0-based page index
 * @param {number}        size       — items per page
 * @param {AbortSignal}   signal     — optional AbortController signal for cancellation
 * @returns {Promise<{ content: object[], totalElements: number, totalPages: number }>}
 */
export const fetchPaymentsFiltered = (customerId, filters = {}, page = 0, size = 20, signal) => {
  const { startDate, endDate, methods, status, search } = filters;
  return API.get('/api/payments', {
    signal,
    params: {
      ...(customerId      ? { customerId }                 : {}),
      page,
      size,
      ...(startDate        ? { startDate }                  : {}),
      ...(endDate          ? { endDate }                    : {}),
      ...(methods?.length  ? { methods: methods.join(',') } : {}),
      ...(status?.length   ? { status:  status.join(',')  } : {}),
      ...(search?.trim()   ? { search:  search.trim() }     : {}),
    },
  }).then((r) => r.data);
};
export const recordBulkPayment = (data) => API.post('/api/payments/bulk', data);
export const fetchCustomerAdvanceBalance = (customerId) => API.get(`/api/payments/customer/${customerId}/advance-balance`);

/**
 * Allocate a single payment across multiple invoices (Phase 2B).
 *
 * POST /api/payments/allocate-bulk
 *
 * Body:
 *   customerId   {number}                 Customer receiving the payment
 *   allocations  {Array<{saleId, amount}>} Per-invoice allocation breakdown
 *   amount       {number}                 Total payment amount (server validates sum ≤ amount)
 *   paymentMethod {string}                e.g. 'CASH', 'UPI', etc.
 *   transactionId {string|undefined}      UTR / reference (required for non-cash methods)
 *   paymentDate  {string}                 ISO datetime string
 *   notes        {string|undefined}       Optional remarks
 *
 * Any amount exceeding the sum of allocations is held as advance credit.
 *
 * Returns: { payments: PaymentDto[], advanceCredited: number }
 */
export const allocatePaymentBulk = (data) =>
  API.post('/api/payments/allocate-bulk', data).then((r) => r.data);


/**
 * Pre-flight duplicate check before recording a new customer payment.
 *
 * POST /api/payments/check-duplicate
 * Body: { customerId, amount, method, transactionId? }
 * Backend response: { duplicate: boolean, existingPayment?: object }
 *
 * Guards the record-payment flow against accidental double-submissions
 * (e.g. navigating back and re-submitting the same form).
 * transactionId is included when available so the backend can also detect
 * exact UTR/RRN matches across payment methods.
 */
export const checkDuplicatePayment = (customerId, amount, method, transactionId) =>
  API.post('/api/payments/check-duplicate', {
    customerId,
    amount,
    method,
    ...(transactionId ? { transactionId } : {}),
  });

// --- CHEQUES ---
// Cheque tracking sits on top of the payment system. A ChequeTracker row is
// auto-created on the backend whenever a payment with method=CHEQUE is recorded.
// These endpoints let admins view, list and progress cheques through their
// ISSUED → CLEARED / BOUNCED / CANCELLED lifecycle.

/**
 * Update the status of a tracked cheque.
 *
 * POST /api/cheques/{id}/update-status
 * Body: { status: 'CLEARED' | 'BOUNCED' | 'CANCELLED', reason?: string }
 * Auth: ADMIN only
 * Response: updated ChequeTrackerDto
 *
 * `reason` is required by the backend when status is BOUNCED or CANCELLED.
 */
export const updateChequeStatus = (id, status, reason = null) =>
  API.post(`/api/cheques/${id}/update-status`, { status, ...(reason ? { reason } : {}) })
    .then((r) => r.data);

/**
 * Fetch cheque details linked to a specific payment.
 *
 * GET /api/cheques?paymentId={paymentId}
 * Auth: ADMIN | OWNER | CASHIER (own shop context)
 * Response: ChequeTrackerDto[] (usually one row per payment)
 */
export const getChequesByPayment = (paymentId) =>
  API.get('/api/cheques', { params: { paymentId } }).then((r) => r.data);

/**
 * List all pending (ISSUED) cheques for an admin dashboard.
 *
 * GET /api/cheques/pending?shopId={shopId}
 * Auth: ADMIN | OWNER
 * Response: ChequeTrackerDto[] ordered by maturityDate ASC, chequeDate ASC
 *
 * omit shopId to let the server derive it from the JWT shop context.
 */
export const getPendingCheques = (shopId = null) =>
  API.get('/api/cheques/pending', shopId ? { params: { shopId } } : undefined)
    .then((r) => r.data);

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

// --- V101 Credit Note enterprise APIs ---

/** Full detail — customer, invoice link, reason code, restock flag, outstanding. */
export const getCreditNoteById = (id) =>
  API.get(`/api/v1/credit-notes/${id}`).then((r) => r.data?.data ?? r.data);

/** Apply remaining credit against one of the customer's unpaid invoices. */
export const allocateCreditToInvoice = (creditNoteId, saleId, amount, note) =>
  API.post(`/api/v1/credit-notes/${creditNoteId}/allocate`,
    { saleId, amount, note }).then((r) => r.data?.data ?? r.data);

/** Record a cash / bank refund payout for the remaining credit. */
export const refundCreditNote = (creditNoteId, amount, paymentMode, paymentReference, note) =>
  API.post(`/api/v1/credit-notes/${creditNoteId}/refund`,
    { amount, paymentMode, paymentReference, note }).then((r) => r.data?.data ?? r.data);

export const listCreditNoteAllocations = (creditNoteId) =>
  API.get(`/api/v1/credit-notes/${creditNoteId}/allocations`).then((r) => r.data?.data ?? []);

export const reverseCreditNoteAllocation = (allocationId, note) =>
  API.post(`/api/v1/credit-notes/allocations/${allocationId}/reverse`,
    { note }).then((r) => r.data?.data ?? r.data);

export const cancelCreditNote = (creditNoteId, note) =>
  API.post(`/api/v1/credit-notes/${creditNoteId}/cancel`,
    { note }).then((r) => r.data?.data ?? r.data);

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

// --- PAYMENT ANALYTICS (Phase 3A) ---

/**
 * Aggregate stats for the payments analytics dashboard.
 *
 * GET /api/payments/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Expected response shape:
 * {
 *   totalCollected:   number,  // sum of all completed payments in range
 *   pendingAmount:    number,  // sum of PENDING payment records
 *   overdueAmount:    number,  // outstanding dues > 30 days
 *   advanceBalance:   number,  // total unallocated advance across all customers
 *   totalCollectedPrev: number, // same metric for the previous equal-length window
 *   pendingAmountPrev:  number,
 *   overdueAmountPrev:  number,
 *   advanceBalancePrev: number,
 *   methodBreakdown: [{ method: string, amount: number, count: number }],
 *   topCustomers:    [{ customerId, customerName, totalPaid, count }],
 *   agingSummary: {
 *     bucket0_30:  number,
 *     bucket31_60: number,
 *     bucket61_90: number,
 *     bucket90plus: number,
 *   },
 * }
 */
export const fetchPaymentStats = (startDate, endDate) =>
  API.get('/api/payments/stats', {
    params: {
      ...(startDate ? { startDate } : {}),
      ...(endDate   ? { endDate }   : {}),
    },
  }).then((r) => r.data);

/**
 * Time-series trend data for the collections line chart.
 *
 * GET /api/payments/trend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&granularity=DAY|WEEK
 *
 * Expected response shape:
 * [{ date: 'YYYY-MM-DD', amount: number }]
 */
export const fetchPaymentTrend = (startDate, endDate, granularity = 'DAY') =>
  API.get('/api/payments/trend', {
    params: {
      ...(startDate   ? { startDate }   : {}),
      ...(endDate     ? { endDate }     : {}),
      ...(granularity ? { granularity } : {}),
    },
  }).then((r) => r.data);

// fetchReceivablesAging is exported from the ACCOUNTING CONTROLLER section below.

// --- PAYMENT RECEIPTS ---
// Returns a signed path like "/api/receipts/signed?token=..." valid for ~30 minutes.
// The receipt is lazily created if this is the first request for the given payment.
export const getPaymentReceiptSignedUrl = (paymentId) =>
  API.get(`/api/payments/${paymentId}/receipt-signed-url`).then((r) => r.data);

// Alias used by ReceiptPreviewModal / ReceiptDownloadButton — matches the naming
// convention of the other document-type signed-URL helpers (e.g. getQuotationSignedUrl).
// 404 means the payment has no receipt on record; surfaces a toast and re-throws
// so callers can decide whether to disable the download button.
export const getReceiptSignedUrl = (paymentId) =>
  API.get(`/api/payments/${paymentId}/receipt-signed-url`)
    .then((r) => r.data)
    .catch((err) => {
      if (err.response?.status === 404) {
        toast.error('Receipt not found');
      }
      throw err;
    });

/**
 * Downloads a receipt (or any signed PDF path) as a Blob and triggers a browser
 * download via a hidden anchor click — the current tab never navigates away.
 *
 * Uses AbortController + 30-second timeout so a hanging network request can't
 * leave the caller stuck indefinitely. Throws on timeout, HTTP error, or an
 * unexpected non-PDF content type so the caller can surface a useful message.
 */
export const downloadReceiptPdf = async (signedPath, filename = 'receipt.pdf') => {
  const url = signedPath.includes('?')
    ? `${signedPath}&download=true`
    : `${signedPath}?download=true`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30000);

  let objectUrl = null;
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'include',
      headers: { Accept: 'application/pdf' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Receipt download failed: HTTP ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    if (!blob.type.includes('pdf')) {
      throw new Error('Unexpected file type received. Expected PDF.');
    }

    objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after the browser has had time to start the download
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
  } catch (err) {
    clearTimeout(timeoutId);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (err.name === 'AbortError') {
      throw new Error('Receipt download timed out. Please try again.');
    }
    throw err;
  }
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
export const addAttachmentToTicket = (data) => {
  const form = new FormData();
  form.append('file', data.file);
  return API.post(`${endpoints.receivingTicketById(data.id)}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};
export const updateReceivingTicket = (data) =>
  API.put(endpoints.receivingTicketById(data.id), data).then(r => r.data);
export const deleteReceivingTicket = (id) =>
  API.delete(endpoints.receivingTicketById(id)).then(r => r.data);

export const fetchAllReceivingTickets = () =>
  API.get(endpoints.fetchAllTicket).then(r => r.data);
export const confirmReceiving = (id, note) =>
  API.post(endpoints.receivingConfirm(id), { note: note ?? null }).then(r => r.data);
export const approveReceiving = (id, note) =>
  API.post(endpoints.receivingApprove(id), { note: note ?? null }).then(r => r.data);
export const cancelReceiving = (id, reason) =>
  API.post(endpoints.receivingCancel(id), { note: reason }).then(r => r.data);
export const getReceivingStatusHistory = (id) =>
  API.get(endpoints.receivingStatusHistory(id)).then(r => r.data);
export const getReceivingThreeWayMatch = (id) =>
  API.get(endpoints.receivingThreeWayMatch(id)).then(r => r.data);
export const getReceivingApprovals = (id) =>
  API.get(endpoints.receivingApprovals(id)).then(r => r.data);
export const approveReceivingStep = (approvalId, note) =>
  API.post(endpoints.receivingApprovalStep(approvalId), { note: note ?? null }).then(r => r.data);
export const listReceivingBins = (itemId) =>
  API.get(endpoints.receivingItemBins(itemId)).then(r => r.data);
export const assignReceivingBin = (itemId, binCode, quantity) =>
  API.post(endpoints.receivingItemBins(itemId), { binCode, quantity }).then(r => r.data);
export const removeReceivingBin = (assignmentId) =>
  API.delete(endpoints.receivingBinById(assignmentId)).then(r => r.data);
export const bulkImportReceiving = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post(endpoints.receivingBulkImport(id), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};
export const debitNoteFromTicket = (ticketId, note) =>
  API.post(endpoints.receivingTicketDebitNote(ticketId), { note: note ?? null }).then(r => r.data);
export const getReceivingNotifications = (id) =>
  API.get(endpoints.receivingNotifications(id)).then(r => r.data);
export const createApInvoice = (payload) =>
  API.post(endpoints.receivingApInvoices, payload).then(r => r.data);
export const getApInvoiceByReceiving = (id) =>
  API.get(endpoints.receivingApInvoiceByReceiving(id)).then(r => r.data);

// Reports
export const fetchReceivingPending = () =>
  API.get(endpoints.receivingReportPending).then(r => r.data);
export const fetchReceivingDiscrepancy = (from, to) =>
  API.get(endpoints.receivingReportDiscrepancy, { params: { from, to } }).then(r => r.data);
export const fetchReceivingAging = (days = 7) =>
  API.get(endpoints.receivingReportAging, { params: { days } }).then(r => r.data);
export const fetchReceivingAgingTickets = (hours = 24) =>
  API.get(endpoints.receivingReportAgingTickets, { params: { hours } }).then(r => r.data);
export const fetchReceivingExpiry = (windowDays = 30) =>
  API.get(endpoints.receivingReportExpiry, { params: { windowDays } }).then(r => r.data);
export const fetchReceivingSupplierPerformance = () =>
  API.get(endpoints.receivingReportSupplierPerformance).then(r => r.data);
export const downloadReceivingCsv = (from, to) =>
  API.get(endpoints.receivingReportExportCsv, { params: { from, to }, responseType: 'blob' })
    .then(r => r.data);
export const downloadReceivingXlsx = (from, to) =>
  API.get(endpoints.receivingReportExportXlsx, { params: { from, to }, responseType: 'blob' })
    .then(r => r.data);
export const createReturnFromReceiving = (id, note) =>
  API.post(endpoints.receivingReturn(id), { note: note ?? null }).then(r => r.data);
export const createAsn = (payload) =>
  API.post(endpoints.receivingAsn, payload).then(r => r.data);
export const listAsnByPo = (poId) =>
  API.get(endpoints.receivingAsnByPo(poId)).then(r => r.data);
export const consumeAsn = (asnId, receivingId) =>
  API.post(endpoints.receivingAsnConsume(asnId), null, { params: { receivingId } }).then(r => r.data);

export const forceClosePurchaseOrder = (id, reason) =>
  API.post(endpoints.purchaseOrderForceClose(id), { reason }).then(r => r.data);
export const getPurchaseOrderHistory = (id) =>
  API.get(endpoints.purchaseOrderHistory(id)).then(r => r.data);
export const getPurchaseOrderApprovals = (id) =>
  API.get(endpoints.purchaseOrderApprovals(id)).then(r => r.data);
export const approvePurchaseOrderStep = (approvalId, note) =>
  API.post(endpoints.purchaseOrderApprovalStep(approvalId), { note: note ?? null }).then(r => r.data);
export const fetchPoAging = (days = 7) =>
  API.get(endpoints.purchaseOrderReportAging, { params: { days } }).then(r => r.data);
export const fetchPoSupplierSpend = (from, to) =>
  API.get(endpoints.purchaseOrderReportSpend, { params: { from, to } }).then(r => r.data);
export const fetchPoFulfillment = () =>
  API.get(endpoints.purchaseOrderReportFulfillment).then(r => r.data);
export const fetchPoBudgetVsActual = (budget) =>
  API.get(endpoints.purchaseOrderReportBudget, { params: { budget } }).then(r => r.data);
export const downloadPoCsv = (from, to) =>
  API.get(endpoints.purchaseOrderReportExport, { params: { from, to }, responseType: 'blob' })
    .then(r => r.data);
export const fetchPoSuggestFromLowStock = () =>
  API.get(endpoints.purchaseOrderSuggestFromLowStock).then(r => r.data);

// Inventory reports
export const fetchStockValuation = () =>
  API.get(endpoints.stockReportValuation).then(r => r.data);
export const downloadStockValuationXlsx = () =>
  API.get(endpoints.stockReportValuationXlsx, { responseType: 'blob' }).then(r => r.data);
export const fetchStockDeadReport = (days = 90) =>
  API.get(endpoints.stockReportDeadStock, { params: { days } }).then(r => r.data);
export const fetchStockShrinkage = (from, to) =>
  API.get(endpoints.stockReportShrinkage, { params: { from, to } }).then(r => r.data);
export const fetchStockAgeing = () =>
  API.get(endpoints.stockReportAgeing).then(r => r.data);
export const fetchStockTurnover = (days = 30) =>
  API.get(endpoints.stockReportTurnover, { params: { days } }).then(r => r.data);

// Reservations
export const createStockReservation = (payload) =>
  API.post(endpoints.stockReservations, payload).then(r => r.data);
export const consumeStockReservation = (id) =>
  API.post(`${endpoints.stockReservationById(id)}/consume`).then(r => r.data);
export const releaseStockReservation = (id) =>
  API.post(`${endpoints.stockReservationById(id)}/release`).then(r => r.data);

// Adjustment approvals
export const fetchAdjustmentApprovals = () =>
  API.get(endpoints.stockAdjustmentApprovals).then(r => r.data);
export const approveAdjustment = (id, note) =>
  API.post(endpoints.stockAdjustmentApprove(id), { note: note ?? null }).then(r => r.data);
export const rejectAdjustment = (id, note) =>
  API.post(endpoints.stockAdjustmentReject(id), { note: note ?? null }).then(r => r.data);

// Cycle counts
export const planCycleCount = (payload) =>
  API.post(endpoints.stockCycleCounts, payload).then(r => r.data);
export const listCycleCounts = () =>
  API.get(endpoints.stockCycleCounts).then(r => r.data);
export const getCycleCount = (id) =>
  API.get(endpoints.stockCycleCountById(id)).then(r => r.data);
export const recordCycleCountLine = (id, lineId, countedQty, reason) =>
  API.post(endpoints.stockCycleCountLineCount(id, lineId), { countedQty, reason }).then(r => r.data);
export const commitCycleCount = (id) =>
  API.post(endpoints.stockCycleCountCommit(id)).then(r => r.data);
export const cancelCycleCount = (id, reason) =>
  API.post(endpoints.stockCycleCountCancel(id), { reason }).then(r => r.data);

// Batch recalls
export const openBatchRecall = (payload) =>
  API.post(endpoints.stockRecalls, payload).then(r => r.data);
export const listBatchRecalls = () =>
  API.get(endpoints.stockRecalls).then(r => r.data);
export const closeBatchRecall = (id, note) =>
  API.post(endpoints.stockRecallClose(id), { note }).then(r => r.data);

// Transfer approvals
export const approveStockTransfer = (id, note) =>
  API.post(endpoints.stockTransferApprove(id), { note }).then(r => r.data);
export const dispatchStockTransfer = (id) =>
  API.post(endpoints.stockTransferDispatch(id)).then(r => r.data);
export const receiveStockTransfer = (id) =>
  API.post(endpoints.stockTransferReceive(id)).then(r => r.data);

// Bundles / UOM / rate card / snooze / saved views / labels
export const listProductBundles = () =>
  API.get(endpoints.inventoryBundles).then(r => r.data);
export const createProductBundle = (payload) =>
  API.post(endpoints.inventoryBundles, payload).then(r => r.data);
export const deactivateProductBundle = (id) =>
  API.post(endpoints.inventoryBundleDeactivate(id)).then(r => r.data);
export const listUomConversions = () =>
  API.get(endpoints.inventoryUom).then(r => r.data);
export const saveUomConversion = (payload) =>
  API.post(endpoints.inventoryUom, payload).then(r => r.data);
export const convertUom = (qty, from, to) =>
  API.get(endpoints.inventoryUomConvert, { params: { qty, from, to } }).then(r => r.data);
export const listSupplierRateCards = (supplierId) =>
  API.get(endpoints.inventoryRateCardBySupplier(supplierId)).then(r => r.data);
export const saveSupplierRateCard = (payload) =>
  API.post(endpoints.inventoryRateCard, payload).then(r => r.data);
export const snoozeAlert = (payload) =>
  API.post(endpoints.inventorySnooze, payload).then(r => r.data);
export const listActiveSnoozes = (alertType) =>
  API.get(endpoints.inventorySnooze, { params: { alertType } }).then(r => r.data);
export const listSavedViews = (surface) =>
  API.get(endpoints.inventorySavedViews, { params: { surface } }).then(r => r.data);
export const saveSavedView = (payload) =>
  API.post(endpoints.inventorySavedViews, payload).then(r => r.data);
export const deleteSavedView = (id) =>
  API.delete(endpoints.inventorySavedViewById(id)).then(r => r.data);
export const printBarcodeLabels = (variantIds, copies = 1) =>
  API.post(endpoints.inventoryLabelsPrint, { variantIds, copies }, { responseType: 'blob' })
    .then(r => r.data);

// QC + temperature
export const recordQcSample = (payload) =>
  API.post(endpoints.receivingQcSamples, payload).then(r => r.data);
export const listQcSamples = (receivingId) =>
  API.get(endpoints.receivingQcByReceiving(receivingId)).then(r => r.data);
export const recordTemperature = (payload) =>
  API.post(endpoints.receivingTempLogs, payload).then(r => r.data);
export const listTemperatureLogs = (receivingId) =>
  API.get(endpoints.receivingTempByReceiving(receivingId)).then(r => r.data);
export const disputeReceiving = (id, note) =>
  API.post(endpoints.receivingDispute(id), { note: note ?? null }).then(r => r.data);
export const resolveReceivingTicket = (id, note) =>
  API.post(endpoints.receivingTicketResolve(id), { note: note ?? null }).then(r => r.data);
export const getReceivingSignedUrl = (id) =>
  API.get(endpoints.receivingSignedUrl(id)).then(r => r.data);

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

// --- PHASE 1: EMPLOYEE MANAGEMENT ---

export const fetchEmployees = (status = null, page = 0, size = 100) => {
  const params = { page, size };
  if (status) params.status = status;
  return API.get('/api/payroll/employees', { params }).then(r => r.data);
};

export const addEmployee = (data) =>
  API.post('/api/payroll/employees', data).then(r => r.data);

export const updateEmployee = (id, data) =>
  API.put(`/api/payroll/employees/${id}`, data).then(r => r.data);

export const getEmployee = (id) =>
  API.get(`/api/payroll/employees/${id}`).then(r => r.data);

export const deleteEmployee = (id) =>
  API.delete(`/api/payroll/employees/${id}`).then(r => r.data);

// --- PHASE 1: SALARY STRUCTURES ---

export const fetchSalaryStructures = (page = 0, size = 100) =>
  API.get('/api/payroll/structures', { params: { page, size } }).then(r => r.data);

export const createSalaryStructure = (data) =>
  API.post('/api/payroll/structures', data).then(r => r.data);

export const updateSalaryStructure = (id, data) =>
  API.put(`/api/payroll/structures/${id}`, data).then(r => r.data);

export const getSalaryStructure = (id) =>
  API.get(`/api/payroll/structures/${id}`).then(r => r.data);

export const addComponentToStructure = (structureId, data) =>
  API.post(`/api/payroll/structures/${structureId}/components`, data).then(r => r.data);

// --- PHASE 1: STAFF LOANS ---

export const createStaffLoan = (employeeId, data) =>
  API.post('/api/payroll/loans', data, { params: { employeeId } }).then(r => r.data);

export const getLoanSchedule = (loanId) =>
  API.get(`/api/payroll/loans/${loanId}/schedule`).then(r => r.data);

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
  API.get('/api/pricing/active').then(res => {
    const d = res.data;
    return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
  });

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

export const getPurchaseReturnSignedUrl = (id) =>
  API.get(endpoints.purchaseReturnSignedUrl(id)).then(r => r.data);

// Debit notes
export const getDebitNote = (id) =>
  API.get(endpoints.debitNoteById(id)).then(r => r.data?.data ?? r.data);
export const createDebitNoteManual = (payload) =>
  API.post(endpoints.debitNotes, payload).then(r => r.data?.data ?? r.data);
export const applyDebitNote = (id, payload) =>
  API.post(endpoints.debitNoteApply(id), payload).then(r => r.data?.data ?? r.data);
export const listDebitNoteApplications = (id) =>
  API.get(endpoints.debitNoteApplications(id)).then(r => r.data?.data ?? []);
export const reverseDebitNoteApplication = (appId, note) =>
  API.post(endpoints.debitNoteApplicationReverse(appId), { note: note ?? null })
    .then(r => r.data?.data ?? r.data);
export const cancelDebitNote = (id, note) =>
  API.post(endpoints.debitNoteCancel(id), { note: note ?? null }).then(r => r.data?.data ?? r.data);
export const fetchDebitNoteAging = () =>
  API.get(endpoints.debitNoteReportAging).then(r => r.data?.data ?? []);
export const fetchDebitNoteSupplierSummary = () =>
  API.get(endpoints.debitNoteReportSupplierSummary).then(r => r.data?.data ?? []);
export const downloadDebitNoteCsv = () =>
  API.get(endpoints.debitNoteReportExportCsv, { responseType: 'blob' }).then(r => r.data);
export const downloadDebitNoteXlsx = () =>
  API.get(endpoints.debitNoteReportExportXlsx, { responseType: 'blob' }).then(r => r.data);

// ─── COMPLIANCE MONITORING (V99 enterprise doc suite) ──────────────
export const fetchSequenceGaps = (table, numberCol = 'invoice_no', fiscalYear) =>
  API.get(endpoints.complianceSequenceGaps, {
    params: { table, numberCol, fiscalYear },
  }).then(r => r.data ?? []);

export const fetchPrintAudit = (minPrints = 2) =>
  API.get(endpoints.compliancePrintAudit, { params: { minPrints } }).then(r => r.data ?? []);

export const fetchEInvoiceCoverage = () =>
  API.get(endpoints.complianceEInvoiceCov).then(r => r.data ?? {});

export const fetchEwayCoverage = () =>
  API.get(endpoints.complianceEwayCov).then(r => r.data ?? {});

// ─── ENTERPRISE E-INVOICE + E-WAY BILL API (new module) ────────────
export const generateIrn = (documentType, documentId, documentNumber, extra = {}) =>
  API.post(endpoints.einvoiceGenerate, { documentType, documentId, documentNumber, ...extra })
    .then(r => r.data);
export const cancelIrn = (irn, reason) =>
  API.post(endpoints.einvoiceCancel, { irn, reason }).then(r => r.data);
export const getIrnForDoc = (documentType, documentId) =>
  API.get(endpoints.einvoiceForDoc(documentType, documentId))
    .then(r => (r.status === 204 ? null : r.data))
    .catch(() => null);

export const generateEwbNew = (documentType, documentId, documentNumber, extra = {}) =>
  API.post(endpoints.ewayGenerate, { documentType, documentId, documentNumber, ...extra })
    .then(r => r.data);
export const cancelEwbNew = (ewbNumber, reason) =>
  API.post(endpoints.ewayCancel, { ewbNumber, reason }).then(r => r.data);
export const getEwbForDoc = (documentType, documentId) =>
  API.get(endpoints.ewayForDoc(documentType, documentId))
    .then(r => (r.status === 204 ? null : r.data))
    .catch(() => null);

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
  API.get('/api/v1/ewaybill/threshold', { suppressErrorToast: true }).then(r => r.data?.data || r.data);


// --- ACCOUNTING CONTROLLER ---
export const fetchProfitAndLoss = (startDate, endDate) =>
  API.get('/api/v1/accounting/pnl', { params: { startDate, endDate } }).then(r => r.data?.data || r.data);

export const fetchReceivablesAging = () =>
  API.get('/api/v1/accounting/receivables-aging').then(r => r.data?.data || r.data);

export const fetchPayablesAging = () =>
  API.get('/api/v1/accounting/payables-aging').then(r => r.data?.data || r.data);

// --- PHASE 2: PAYROLL RUN OPERATIONS ---
export const createPayrollRun = (month, year) =>
  API.post('/api/payroll/runs', {}, { params: { month, year } }).then(r => r.data);

export const fetchPayrollRuns = (page = 0, size = 10) =>
  API.get('/api/payroll/runs', { params: { page, size } }).then(r => r.data);

export const getPayrollRun = (runId) =>
  API.get(`/api/payroll/runs/${runId}`).then(r => r.data);

export const markPayrollRunAsProcessing = (runId) =>
  API.post(`/api/payroll/runs/${runId}/process`).then(r => r.data);

export const approvePayrollRun = (runId, userId) =>
  API.post(`/api/payroll/runs/${runId}/approve`, {}, { params: { userId } }).then(r => r.data);

export const disbursePayrollRun = (runId, userId) =>
  API.post(`/api/payroll/runs/${runId}/disburse`, {}, { params: { userId } }).then(r => r.data);

// --- PHASE 2: PAYROLL SLIP OPERATIONS ---
export const fetchPayrollSlips = (runId, page = 0, size = 10) =>
  API.get(`/api/payroll/runs/${runId}/slips`, { params: { page, size } }).then(r => r.data);

export const getPayrollSlip = (slipId) =>
  API.get(`/api/payroll/slips/${slipId}`).then(r => r.data);

export const updatePayrollSlip = (slipId, data) =>
  API.put(`/api/payroll/slips/${slipId}`, data).then(r => r.data);

// --- PHASE 2: ATTENDANCE OPERATIONS ---
export const recordAttendance = (employeeId, date, type) =>
  API.post('/api/payroll/attendance', {}, { params: { employeeId, date, type } }).then(r => r.data);

export const fetchAttendanceForPeriod = (employeeId, startDate, endDate) =>
  API.get('/api/payroll/attendance', { params: { employeeId, startDate, endDate } }).then(r => r.data);

// --- PHASE 3: STATUTORY COMPLIANCE OPERATIONS ---
export const applyStatutoryDeductions = (runId) =>
  API.post(`/api/payroll/runs/${runId}/statutory`).then(r => r.data);

// --- PHASE 3: BANKING INTEGRATION OPERATIONS ---
export const disburseViaRazorpayX = (runId) =>
  API.post(`/api/payroll/runs/${runId}/disburse-razorpayx`).then(r => r.data);

export const exportNEFTBatch = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-neft`).then(r => r.data);

export const exportNACHBatch = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-nach`).then(r => r.data);

export const exportECRFile = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-ecr`).then(r => r.data);

export const fetchBankTransactions = (status = 'PENDING', page = 0, size = 10) =>
  API.get('/api/payroll/bank-transactions', { params: { status, page, size } }).then(r => r.data);

export const validateBankDetails = (employeeId) =>
  API.get(`/api/payroll/employees/${employeeId}/validate-bank`).then(r => r.data);

// --- PHASE 4: EMPLOYEE SELF-SERVICE OPERATIONS ---
export const fetchMyPayslips = (page = 0, size = 10) =>
  API.get('/api/payroll/employee/payslips', { params: { page, size } }).then(r => r.data);

export const getMyPayslip = (slipId) =>
  API.get(`/api/payroll/employee/payslips/${slipId}`).then(r => r.data);

export const getMyAttendance = (month, year) =>
  API.get('/api/payroll/employee/attendance', { params: { month, year } }).then(r => r.data);

export const getMyTaxDeclaration = (financialYear) =>
  API.get('/api/payroll/employee/tax-declaration', { params: { financialYear } }).then(r => r.data);

export const submitTaxDeclaration = (data) =>
  API.post('/api/payroll/employee/tax-declaration', data).then(r => r.data);

export const requestSalaryAdvance = (amount, reason) =>
  API.post('/api/payroll/employee/advance-requests', {}, { params: { amount, reason } }).then(r => r.data);

export const fetchMyAdvanceRequests = (page = 0, size = 10) =>
  API.get('/api/payroll/employee/advance-requests', { params: { page, size } }).then(r => r.data);

export const fetchMyLoans = (page = 0, size = 10) =>
  API.get('/api/payroll/employee/loans', { params: { page, size } }).then(r => r.data);

export const fetchDispatchHistory = (page = 0, size = 10) =>
  API.get('/api/payroll/employee/dispatch-history', { params: { page, size } }).then(r => r.data);

export const getMyForm16 = (financialYear) =>
  API.get('/api/payroll/employee/form16', { params: { financialYear } }).then(r => r.data);

export const getEssPreferences = () =>
  API.get('/api/payroll/employee/ess-preferences').then(r => r.data);

export const updateEssPreferences = (data) =>
  API.put('/api/payroll/employee/ess-preferences', data).then(r => r.data);

export default API;


// --- ALIASES & MISSING PAYROLL API FUNCTIONS ---

// Aliases for exportNEFTBatch / exportNACHBatch so Step5Disbursal can call api.exportNEFT / api.exportNACH
export const exportNEFT = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-neft`).then(r => r.data);

export const exportNACH = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-nach`).then(r => r.data);

// Blob-download versions for BankingIntegration.jsx (triggers browser file save)
export const exportNEFTBlob = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-neft`, { responseType: 'blob' }).then(r => r.data);

export const exportNACHBlob = (runId) =>
  API.get(`/api/payroll/runs/${runId}/export-nach`, { responseType: 'blob' }).then(r => r.data);

// Statutory Config CRUD (used by StatutoryCompliance.jsx)
export const getStatutoryConfig = () =>
  API.get('/api/payroll/statutory-config').then(r => r.data);

export const saveStatutoryConfig = (data) =>
  API.post('/api/payroll/statutory-config', data).then(r => r.data);

// --- MISSING LEAVE MANAGEMENT APIs ---
// ESS endpoint — for employee creating leave applications
// Backend: POST /api/payroll/employee/leave-applications (EXISTS — PayrollController.java:609)
export const createLeaveApplication = (employeeId, data) =>
  API.post('/api/payroll/employee/leave-applications', data, { params: { employeeId } }).then(r => r.data);

// TODO: Backend GET /api/payroll/employee/leave-applications is MISSING from PayrollController.java
// Only POST exists for creating leave applications on this path.
// Required spec: GET /api/payroll/employee/leave-applications?page={page}&size={size}
//   → Page<LeaveApplicationDto> for the authenticated employee's own applications
export const listLeaveApplications = (page = 0, size = 10) =>
  API.get('/api/payroll/employee/leave-applications', { params: { page, size } }).then(r => r.data);

// Admin endpoint — list ALL applications across all employees (for Leave Approvals page)
// Backend: GET /api/payroll/leave-applications?status= (EXISTS — PayrollController.java:619)
export const listAdminLeaveApplications = (status = 'PENDING') =>
  API.get('/api/payroll/leave-applications', { params: { status } }).then(r => r.data);

// Backend: POST /api/payroll/leave-applications/{id}/approve (EXISTS — PayrollController.java:626)
export const approveLeaveApplication = (applicationId) =>
  API.post(`/api/payroll/leave-applications/${applicationId}/approve`).then(r => r.data);

// Backend: POST /api/payroll/leave-applications/{id}/reject (EXISTS — PayrollController.java:633)
export const rejectLeaveApplication = (applicationId, reason) =>
  API.post(`/api/payroll/leave-applications/${applicationId}/reject`, {}, { params: { reason } }).then(r => r.data);

// Backend: GET /api/payroll/leave-balance (EXISTS — PayrollController.java:641)
export const getLeaveBalance = (employeeId, leaveTypeId) =>
  API.get('/api/payroll/leave-balance', { params: { employeeId, leaveTypeId } }).then(r => r.data);

// --- MISSING LOAN REQUEST APIs ---
// Backend: POST /api/payroll/employee/loans — ESS employee self-service create loan request
// (maps to GET /api/payroll/employee/loans which EXISTS — PayrollController.java:429)
export const createLoanRequest = (employeeId, data) =>
  API.post('/api/payroll/employee/loans', data, { params: { employeeId } }).then(r => r.data);

// TODO: Backend GET /api/payroll/employees/{employeeId}/loans is MISSING from PayrollController.java
// Required spec: GET /api/payroll/employees/{employeeId}/loans?page={page}&size={size}
//   → Page<StaffLoanDto> for admin/manager to view an employee's loan history
export const getEmployeeLoans = (employeeId, page = 0, size = 10) =>
  API.get(`/api/payroll/employees/${employeeId}/loans`, { params: { page, size } }).then(r => r.data);

// TODO: Backend POST /api/payroll/loans/{loanId}/approve is MISSING from PayrollController.java
// Required spec: POST /api/payroll/loans/{loanId}/approve → StaffLoanDto (ADMIN/PAYROLL_ADMIN)
export const approveLoan = (loanId) =>
  API.post(`/api/payroll/loans/${loanId}/approve`).then(r => r.data);

// TODO: Backend POST /api/payroll/loans/{loanId}/reject is MISSING from PayrollController.java
// Required spec: POST /api/payroll/loans/{loanId}/reject?reason={reason} → StaffLoanDto (ADMIN/PAYROLL_ADMIN)
export const rejectLoan = (loanId, reason) =>
  API.post(`/api/payroll/loans/${loanId}/reject`, {}, { params: { reason } }).then(r => r.data);

// --- MISSING GRATUITY APIs ---
export const getEmployeeGratuity = (employeeId) =>
  API.get(`/api/payroll/employees/${employeeId}/gratuity`).then(r => r.data);

export const calculateBulkGratuity = () =>
  API.get('/api/payroll/gratuity/bulk').then(r => r.data);

// --- MISSING LEAVE TYPES & HOLIDAYS ---
export const createLeaveType = (data) =>
  API.post('/api/payroll/leave-types', data).then(r => r.data);

export const listLeaveTypes = () =>
  API.get('/api/payroll/leave-types').then(r => r.data);

export const createHolidayCalendar = (data) =>
  API.post('/api/payroll/holiday-calendar', data).then(r => r.data);

export const getHolidayCalendar = (year) =>
  API.get('/api/payroll/holiday-calendar', { params: { year } }).then(r => r.data);

// --- MISSING FORM 16 & PDF Downloads ---
export const getForm16Pdf = (financialYear) =>
  API.get('/api/payroll/employee/form16/pdf', { params: { financialYear }, responseType: 'blob' }).then(r => r.data);

export const getPayslipPdf = (slipId) =>
  API.get(`/api/payroll/slips/${slipId}/pdf`, { responseType: 'blob' }).then(r => r.data);

// --- MISSING GL POSTING ---
export const postPayrollToGL = (runId) =>
  API.post(`/api/payroll/runs/${runId}/post-to-gl`).then(r => r.data);

// --- MISSING STATUTORY RETURNS ---
export const getEsicReturn = (runId) =>
  API.get(`/api/payroll/statutory/esic-return/${runId}`, { responseType: 'blob' }).then(r => r.data);

export const getTdsReturnBlob = (financialYear, quarter) =>
  API.get('/api/payroll/statutory/24q-tds', { params: { financialYear, quarter }, responseType: 'blob' }).then(r => r.data);

export const getLwfReturnBlob = (month, year, state) =>
  API.get('/api/payroll/statutory/lwf-return', { params: { month, year, state }, responseType: 'blob' }).then(r => r.data);

// --- MISSING PAYROLL REPORTS ---
// TODO: Backend GET /api/payroll/runs/{runId}/reports is MISSING from PayrollController.java
// Required spec: GET /api/payroll/runs/{runId}/reports → PayrollRunReportDto
//   (detailed breakdown of the run: gross, deductions, net, employee count, etc.)
export const getPayrollReports = (runId) =>
  API.get(`/api/payroll/runs/${runId}/reports`).then(r => r.data);

// TODO: Backend GET /api/payroll/summary is MISSING from PayrollController.java
// Required spec: GET /api/payroll/summary → PayrollSummaryDto
//   (current month totals: headcount, gross, deductions, net, pending approvals)
export const getPayrollSummary = () =>
  API.get('/api/payroll/summary').then(r => r.data);

// --- MISSING DISPATCH STATS ---
// Backend: GET /api/payroll/runs/{runId}/dispatch-stats (EXISTS — PayrollController.java:503)
export const getDispatchStats = (runId) =>
  API.get(`/api/payroll/runs/${runId}/dispatch-stats`).then(r => r.data);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — BACKEND INTEGRATION: ESS PORTAL NAMED EXPORTS
// Audit date: 2026-08-24  |  Source: PayrollController.java
// Legend:  [EXISTS] = backend endpoint confirmed  [MISSING] = TODO for backend team
// ═══════════════════════════════════════════════════════════════════════════════

// --- LOAN DETAILS API ---
// TODO: [MISSING] Backend GET /api/payroll/loans/{loanId} does NOT exist in PayrollController.java
// Required spec: GET /api/payroll/loans/{loanId}
//   Auth: ADMIN | PAYROLL_ADMIN | EMPLOYEE (own loans only)
//   Response: StaffLoanDto { id, employeeId, principalAmount, remainingBalance, emiAmount,
//             startDate, tenure, status (PENDING|ACTIVE|CLOSED|REJECTED), repaymentSchedule[] }
export const getLoanDetails = (loanId) =>
  API.get(`/api/payroll/loans/${loanId}`).then(r => r.data);

// --- ADVANCE REQUEST APIs (Admin approval side) ---
// [EXISTS] Employee self-service create — POST /api/payroll/employee/advance-requests
// createAdvanceRequest is a named alias matching the task spec; delegates to requestSalaryAdvance.
export const createAdvanceRequest = (amount, reason) =>
  requestSalaryAdvance(amount, reason);

// [EXISTS] Employee self-service list — GET /api/payroll/employee/advance-requests
// getAdvanceRequests is a named alias matching the task spec; delegates to fetchMyAdvanceRequests.
export const getAdvanceRequests = (page = 0, size = 10) =>
  fetchMyAdvanceRequests(page, size);

// TODO: [MISSING] Backend POST /api/payroll/advance-requests/{advanceId}/approve does NOT exist in PayrollController.java
// Required spec: POST /api/payroll/advance-requests/{advanceId}/approve
//   Auth: ADMIN | PAYROLL_ADMIN | MANAGER
//   Response: AdvanceRequestDto { id, employeeId, amount, reason, status, approvedBy, approvedAt }
export const approveAdvance = (advanceId) =>
  API.post(`/api/payroll/advance-requests/${advanceId}/approve`).then(r => r.data);

// TODO: [MISSING] Backend POST /api/payroll/advance-requests/{advanceId}/reject does NOT exist in PayrollController.java
// Required spec: POST /api/payroll/advance-requests/{advanceId}/reject?reason={reason}
//   Auth: ADMIN | PAYROLL_ADMIN | MANAGER
//   Response: AdvanceRequestDto with status=REJECTED and rejectionReason populated
export const rejectAdvance = (advanceId, reason) =>
  API.post(`/api/payroll/advance-requests/${advanceId}/reject`, {}, { params: { reason } }).then(r => r.data);

// --- TAX & COMPLIANCE ALIASES ---
// getForm16Data: named alias for task-spec compliance — delegates to getMyForm16
// [EXISTS] Backend: GET /api/payroll/employee/form16?financialYear= (PayrollController.java:443)
export const getForm16Data = (financialYear) =>
  getMyForm16(financialYear);

// downloadForm16Pdf: triggers authenticated PDF blob download — delegates to getForm16Pdf
// [EXISTS] Backend: GET /api/payroll/employee/form16/pdf?financialYear= (PayrollController.java:680)
export const downloadForm16Pdf = (financialYear) =>
  getForm16Pdf(financialYear);

// getTaxDeclarations: named alias for task-spec compliance — delegates to getMyTaxDeclaration
// [EXISTS] Backend: GET /api/payroll/employee/tax-declaration?financialYear= (PayrollController.java:399)
export const getTaxDeclarations = (financialYear) =>
  getMyTaxDeclaration(financialYear);

// TODO: [MISSING] Backend GET /api/payroll/tax-summary does NOT exist in PayrollController.java
// Required spec: GET /api/payroll/tax-summary?financialYear={financialYear}
//   Auth: EMPLOYEE (own data) | ADMIN | PAYROLL_ADMIN
//   Response: TaxSummaryDto { financialYear, taxableIncome, exemptions, tdsDeducted,
//             totalTaxLiability, regime (OLD|NEW), breakdownByMonth[] }
export const getTaxSummary = (financialYear) =>
  API.get('/api/payroll/tax-summary', { params: { financialYear } }).then(r => r.data);

// --- PAYROLL REPORTS — ADDITIONAL NAMED EXPORTS ---
// generatePayslip: triggers on-demand generation/re-generation of a payslip for a specific employee+run.
// TODO: [MISSING] Backend POST /api/payroll/runs/{runId}/generate-payslip does NOT exist in PayrollController.java
// Required spec: POST /api/payroll/runs/{runId}/generate-payslip?employeeId={employeeId}
//   Auth: ADMIN | PAYROLL_ADMIN
//   Response: PayrollSlipDto with freshly computed values
//   Note: to download an existing payslip PDF use getPayslipPdf(slipId) → GET /api/payroll/slips/{slipId}/pdf
export const generatePayslip = (runId, employeeId) =>
  API.post(`/api/payroll/runs/${runId}/generate-payslip`, {}, { params: { employeeId } }).then(r => r.data);

// getMonthlyPayroll: fetches aggregated payroll data for a given month/year.
// TODO: [MISSING] Backend GET /api/payroll/monthly does NOT exist in PayrollController.java
// Required spec: GET /api/payroll/monthly?month={month}&year={year}
//   Auth: ADMIN | PAYROLL_ADMIN | MANAGER
//   Response: MonthlyPayrollSummaryDto { month, year, totalGross, totalDeductions, totalNet,
//             headcount, runId, status, employeeBreakdown[] }
//   Workaround until implemented: use fetchPayrollRuns() and filter client-side by month/year.
export const getMonthlyPayroll = (month, year) =>
  API.get('/api/payroll/monthly', { params: { month, year } }).then(r => r.data);

// getYTDSummary: year-to-date cumulative payroll summary.
// TODO: [MISSING] Backend GET /api/payroll/ytd-summary does NOT exist in PayrollController.java
// Required spec: GET /api/payroll/ytd-summary?financialYear={financialYear}
//   Auth: ADMIN | PAYROLL_ADMIN
//   Response: YTDSummaryDto { financialYear, totalGross, totalDeductions, totalNet,
//             totalTDS, totalPF, totalESIC, totalLWF, monthlyBreakdown[] }
export const getYTDSummary = (financialYear) =>
  API.get('/api/payroll/ytd-summary', { params: { financialYear } }).then(r => r.data);

// --- BANK RECONCILIATION ---

/**
 * Submit a reconciliation result — the set of bank-to-payment matches confirmed
 * by the finance user.
 *
 * POST /api/payments/reconcile
 *   Auth: ADMIN | FINANCE
 *   Body: {
 *     bankTransactions: Array<{ id, date, amount, description, bankRef }>,
 *     matches:          Array<{ bankTransactionId, paymentId }>
 *   }
 *   Response: { matchedCount, unmatchedBankCount, unmatchedPaymentCount, reconciliationId }
 */
export const submitReconciliation = (payload) =>
  API.post('/api/payments/reconcile', payload);

/**
 * Fetch a reconciliation report for the given date range.
 *
 * GET /api/payments/reconciliation-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *   Auth: ADMIN | FINANCE
 *   Response: CSV text or JSON array of matched/unmatched entries
 */
export const fetchReconciliationReport = (startDate, endDate) =>
  API.get('/api/payments/reconciliation-report', { params: { startDate, endDate } });

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE EXPENSES API
// ═══════════════════════════════════════════════════════════════════════════════

// ── Expense CRUD ──────────────────────────────────────────────────────────────
export const createExpenseEnterprise = (data) => API.post(endpoints.expenses, data);
export const getExpenseEnterprise = (id) => API.get(endpoints.expenseById(id));
export const getExpensesEnterprise = (params) => API.get(endpoints.expenses, { params });
export const updateExpenseEnterprise = (id, data) => API.put(endpoints.expenseById(id), data);
export const deleteExpenseEnterprise = (id) => API.delete(endpoints.expenseById(id));

// ── Expense Approvals ─────────────────────────────────────────────────────────
export const submitExpenseForApproval = (id, data) => API.post(endpoints.expenseSubmit(id), data);
export const getPendingApprovals = (params) => API.get(endpoints.expenseApprovalsPending, { params });
export const getPendingApprovalsCount = () => API.get(endpoints.expenseApprovalsPendingCount);
export const approveExpense = (id, data) => API.post(endpoints.expenseApprove(id), data);
export const rejectExpense = (id, data) => API.post(endpoints.expenseReject(id), data);
export const escalateExpense = (id, data) => API.post(endpoints.expenseEscalate(id), data);
export const getApprovalTimeline = (id) => API.get(`${endpoints.expenseApprovals}/${id}/history`);

// ── Expense Analytics ─────────────────────────────────────────────────────────
export const getDashboardMetrics = () => API.get(endpoints.expenseAnalyticsDashboard);
export const getCategorySpending = (categoryId, startDate, endDate) =>
  API.get(endpoints.expenseAnalyticsSpending, { params: { categoryId, startDate, endDate } });
export const getEmployeeExpenses = (employeeId, params) =>
  API.get(endpoints.expenseEmployeeExpenses(employeeId), { params });

// ── Expense Categories ────────────────────────────────────────────────────────
export const getExpenseCategories = () => API.get(endpoints.expenseCategories);
export const getExpenseCategoryById = (id) => API.get(endpoints.expenseCategoryById(id));
export const getExpenseSubcategories = (id) => API.get(endpoints.expenseCategorySubcategories(id));
export const getExpenseCategoryHierarchy = (id) => API.get(endpoints.expenseCategoryHierarchy(id));
export const createExpenseCategory = (data) => API.post(endpoints.expenseCategories, data);
export const updateExpenseCategory = (id, data) => API.put(endpoints.expenseCategoryById(id), data);
export const deleteExpenseCategory = (id) => API.delete(endpoints.expenseCategoryById(id));

// ── Expense Reconciliation ────────────────────────────────────────────────────
export const getReconciliationSummary = (startDate, endDate) =>
  API.get(endpoints.expenseReconciliationSummary, { params: { startDate, endDate } });
export const getUnmatchedExpenses = (params) =>
  API.get(endpoints.expenseReconciliationUnmatched, { params });
export const getReimbursedExpenses = (params) =>
  API.get(endpoints.expenseReconciliationReimbursed, { params });
export const markExpenseAsReimbursed = (id, data) =>
  API.post(endpoints.expenseReconciliationMarkReimbursed(id), data);

// ── GST / HSN preview ─────────────────────────────────────────────────────────
export const fetchHsnPreview = (year, month) =>
  API.get(`/api/v1/gst/gstr1/hsn-preview?year=${year}&month=${month}`)
     .then(r => r.data.data);

// ── Compliance credit notes ───────────────────────────────────────────────────
export const createComplianceCreditNote = (dto) =>
  API.post('/api/v1/compliance/credit-notes', dto).then(r => r.data);


// ── GSTR-3B ───────────────────────────────────────────────────────────────────
export const fetchGstr3b = (year, month) =>
  API.get(`/api/v1/gst/gstr3b?year=${year}&month=${month}`)
     .then(r => r.data.data ?? r.data);

export const downloadGstr3bJson = (year, month) =>
  API.get(`/api/v1/gst/gstr3b/download?year=${year}&month=${month}`)
     .then(r => r.data.data ?? r.data);

// ── Period Lock ───────────────────────────────────────────────────────────────
export const getPeriodLocks = (year) =>
  API.get(`/api/v1/compliance/period-locks?year=${year}`).then(r => r.data.data ?? r.data);

export const lockPeriod = (payload) =>
  API.post('/api/v1/compliance/period-locks/lock', payload).then(r => r.data.data ?? r.data);

export const unlockPeriod = (payload) =>
  API.post('/api/v1/compliance/period-locks/unlock', payload).then(r => r.data.data ?? r.data);

// ── GSTR-2B Reconciliation ────────────────────────────────────────────────────
export const uploadGstr2bJson = (file, year, month) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(`/api/v1/compliance/gstr2b/upload?year=${year}&month=${month}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data ?? r.data);
};

export const getGstr2bReconciliation = (year, month) =>
  API.get(`/api/v1/compliance/gstr2b/reconciliation?year=${year}&month=${month}`)
     .then(r => r.data.data ?? r.data);

export const manualMatchGstr2b = (entryId, purchaseId) =>
  API.post(`/api/v1/compliance/gstr2b/${entryId}/manual-match?purchaseId=${purchaseId}`)
     .then(r => r.data.data ?? r.data);

export const acceptMismatchGstr2b = (entryId) =>
  API.post(`/api/v1/compliance/gstr2b/${entryId}/accept-mismatch`)
     .then(r => r.data.data ?? r.data);

// ── GSTR-9 Annual Return ─────────────────────────────────────────────────────
export const fetchGstr9 = (fiscalYear) =>
  API.get(`/api/v1/gst/gstr9/summary?fiscalYear=${fiscalYear}`)
     .then(r => r.data.data ?? r.data);

// ── HSN Master Search ────────────────────────────────────────────────────────
export const searchHsn = (q) =>
  API.get(`/api/v1/compliance/hsn/search?q=${encodeURIComponent(q)}`)
     .then(r => r.data.data ?? r.data);
