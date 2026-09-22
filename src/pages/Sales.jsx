import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorState from '../components/common/ErrorState';
import useDataLoading from '../hooks/useDataLoading';
import { useOfflineSales } from '../hooks/useOfflineSales';
import {
  Box, Snackbar, Alert, CircularProgress,
  Typography, Paper, Button, IconButton, Tooltip, Stack, Menu, MenuItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, alpha,
  Drawer, List, ListItem, ListItemText as MuiListItemText, Divider, Badge
} from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import StatutoryFieldset from '../components/StatutoryFieldset';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { buildSalePayload } from '../utils/salesUtils';
import {
  fetchCustomers, fetchCustomer, createSale, fetchItemVariants, createCustomer,
  draftSale, getSaleById, completeDraftSale, fetchItemSubstitutes,
  parkSale as parkSaleApi, discardDraftSale
} from '../services/api';
import { listSalesByShop } from '../services/offline/offlineDb';
import { listItemVariantsByShop, listCustomersByShop } from '../services/offline/offlineReferenceCache';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useSubscription } from '../context/SubscriptionContext';
import EnterpriseUpgradeModal from '../components/subscriptions/EnterpriseUpgradeModal';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';

// ============ CONSTANTS ============
const initialItem = {
  id: '', sku: '', qty: '', unitPrice: 0, itemName: '', description: '',
  color: [], size: [], brand: '', design: '', currentStock: 0,
  discount: 0,
};

const initialCustomer = {
  name: '', phone: '', addressLine1: '', addressLine2: '', city: '',
  state: '', postalCode: '', country: '', gstNumber: '', panNumber: '',
  notes: '', creditBalance: 0,
};

const initialFormData = {
  id: null, customerId: '', items: [], totalAmount: 0, isGstRequired: 'no',
  discount: 0, paymentMethods: [{ method: 'Cash', amount: 0 }],
  remaining: 0, paymentStatus: 'Pending', deliveryRequired: false,
  deliveryAddress: '', deliveryCharge: 0, deliveryPaidBy: null,
  deliveryNotes: '', deliveryStatus: 'PACKED',
  saleNotes: '',
  // Statutory GST — all optional, backend derives sensible defaults when blank.
  placeOfSupply: '',
  supplyType: '',
  reverseCharge: false,
  billToAddress: '',
  shipToAddress: '',
  consigneeAddress: '',
};

const initialSearchParams = {
  name: '', sku: '', color: [], size: [], design: '',
  category: '', attribute1: '', attribute2: '', fit: '',
};

// ============ HELPER FUNCTIONS ============

/**
 * Generate unique filter options from variants
 */
const generateFilterOptions = (variants, field) => {
  const baseOption = { value: '', label: `All ${field.charAt(0).toUpperCase() + field.slice(1)}s` };

  const uniqueValues = [...new Set(
    variants
      .map(v => v[field] || (field === 'name' ? v.itemName : null))
      .filter(Boolean)
  )];

  return [baseOption, ...uniqueValues.map(val => ({ value: val, label: val }))];
};

/**
 * Validate delivery details
 */
const isDeliveryValid = (formData) => {
  if (!formData.deliveryRequired) return true;
  const hasAddress = formData.deliveryAddress?.trim().length > 0;
  const hasPaidBy = formData.deliveryPaidBy !== '' && formData.deliveryPaidBy !== null;
  return hasAddress && hasPaidBy;
};

// ============ CUSTOM HOOKS ============

/**
 * Hook to manage URL parameters
 */
const useURLParams = () => {
  const [urlParams, setUrlParams] = useSearchParams();
  const tabValue = urlParams.get('tab') === 'history' ? 1 : 0;
  const resumeId = urlParams.get('resumeId');

  useEffect(() => {
    if (!urlParams.get('tab')) {
      setUrlParams({ tab: 'sale' }, { replace: true });
    }
  }, []);

  return {
    tabValue,
    setTabValue: (val) => setUrlParams({ tab: val === 1 ? 'history' : 'sale' }),
    resumeId,
    clearParams: () => setUrlParams({})
  };
};

/**
 * Hook to load data with offline fallback
 */
const useLoadData = (shopId, isOffline) => {
  const [variants, setVariants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const loadVariants = useCallback(async () => {
    setLoading(true);
    try {
      if (isOffline && shopId) {
        const cached = await listItemVariantsByShop(shopId);
        if (cached.length > 0) {
          setVariants(cached.map((v) => ({
            value: v.id,
            label: `${v.itemName} (${v.color || ''}, ${v.size || ''}) - SKU: ${v.sku || ''}`,
            ...v,
          })));
          return;
        }
      }
      const res = await fetchItemVariants({});
      const data = Array.isArray(res.data) ? res.data : [];
      setVariants(data.map((v) => ({
        value: v.id,
        label: `${v.itemName} (${v.color}, ${v.size}) - SKU: ${v.sku}`,
        ...v,
      })));
    } catch (err) {
      if (shopId) {
        try {
          const cached = await listItemVariantsByShop(shopId);
          if (cached.length > 0) {
            setVariants(cached.map((v) => ({
              value: v.id,
              label: `${v.itemName} (${v.color || ''}, ${v.size || ''}) - SKU: ${v.sku || ''}`,
              ...v,
            })));
            return;
          }
        } catch (_) {}
      }
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [shopId, isOffline]);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      if (isOffline && shopId) {
        const cached = await listCustomersByShop(shopId);
        if (cached.length > 0) {
          setCustomers(cached.map((cust) => ({
            value: cust.id,
            label: `${cust.name} | Phone: ${cust.phone || 'N/A'}`,
            ...cust,
          })));
          return;
        }
      }
      const res = await fetchCustomers();
      setCustomers((res.data || []).map((cust) => ({
        value: cust.id,
        label: `${cust.name} | Phone: ${cust.phone || 'N/A'}`,
        ...cust,
      })));
    } catch (err) {
      if (shopId) {
        try {
          const cached = await listCustomersByShop(shopId);
          if (cached.length > 0) {
            setCustomers(cached.map((cust) => ({
              value: cust.id,
              label: `${cust.name} | Phone: ${cust.phone || 'N/A'}`,
              ...cust,
            })));
            return;
          }
        } catch (_) {}
      }
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [shopId, isOffline]);

  useEffect(() => {
    loadVariants();
    loadCustomers();
  }, [loadVariants, loadCustomers]);

  return {
    variants,
    setVariants,
    customers,
    setCustomers,
    loading,
    setLoading,
    loadingCustomers,
    setLoadingCustomers,
    loadVariants,
    loadCustomers,
  };
};

// ============ MAIN COMPONENT ============

const Sales = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isJewellery, industryType, shop } = useShop();
  const { getStatus, canProcessSale, canStartTrial, subscription } = useSubscription();
  const { tabValue, setTabValue, resumeId, clearParams } = useURLParams();
  const { loading: loadError, error, executeLoad } = useDataLoading();
  const { isOffline, pendingCount, isSyncing, syncNow, resetFailedSale, lastSyncResult } = useOfflineSales();

  const hasBanner = getStatus() === 'PENDING';
  const outerHeight = hasBanner ? 'calc(100vh - 164px)' : 'calc(100vh - 100px)';

  // ── FORM STATES ──
  const [formData, setFormData] = useState(initialFormData);
  const [item, setItem] = useState(initialItem);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [searchParams, setSearchParams] = useState(initialSearchParams);
  const [editIndex, setEditIndex] = useState(null);
  const [itemError, setItemError] = useState('');
  const [substitutes, setSubstitutes] = useState([]);

  // ── DATA LOADING ──
  const {
    variants,
    setVariants,
    customers,
    setCustomers,
    loading,
    setLoading,
    loadingCustomers,
    setLoadingCustomers,
    loadVariants,
    loadCustomers,
  } = useLoadData(shop?.id, isOffline);

  const handleLoadSalesData = useCallback(async () => {
    await executeLoad(async () => {
      await Promise.all([
        new Promise(resolve => { loadVariants(); resolve(); }),
        new Promise(resolve => { loadCustomers(); resolve(); })
      ]);
    });
  }, [executeLoad, loadVariants, loadCustomers]);

  useEffect(() => {
    handleLoadSalesData();
  }, [handleLoadSalesData]);

  // ── UI STATES ──
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [upgradeModalData, setUpgradeModalData] = useState({ open: false, upgradeOptions: null, message: null, feature: null });
  const [notesExpanded, setNotesExpanded] = useState(false);

  // ── OFFLINE QUEUE DRAWER ──
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState(false);
  const [offlineQueueSales, setOfflineQueueSales] = useState([]);
  const [offlineQueueLoading, setOfflineQueueLoading] = useState(false);

  const loadOfflineQueue = useCallback(async () => {
    if (!shop?.id) return;
    setOfflineQueueLoading(true);
    try {
      // Always load from local IndexedDB first (works offline)
      const [drafts, failed, syncing] = await Promise.all([
        listSalesByShop(shop.id, 'DRAFT').catch(() => []),
        listSalesByShop(shop.id, 'FAILED').catch(() => []),
        listSalesByShop(shop.id, 'SYNCING').catch(() => []),
      ]);
      const local = [...drafts, ...failed, ...syncing];

      // If online, also fetch server-side queue and merge (dedup by clientTxnId)
      let serverSales = [];
      if (!isOffline) {
        try {
          const res = await import('../services/api').then(m => m.getOfflineQueueList(shop.id));
          serverSales = res.data || [];
        } catch (_) {
          // Server fetch failed — fall back to local-only, non-fatal
        }
      }

      // Merge: local takes precedence (it has the full payload); server fills in any gaps
      const localIds = new Set(local.map(s => s.clientTxnId));
      const serverOnly = serverSales.filter(s => !localIds.has(s.clientTxnId));

      const all = [...local, ...serverOnly]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOfflineQueueSales(all);
    } catch (err) {
      console.error('Failed to load offline queue:', err);
    } finally {
      setOfflineQueueLoading(false);
    }
  }, [shop?.id, isOffline]);

  useEffect(() => {
    if (offlineDrawerOpen) loadOfflineQueue();
  }, [offlineDrawerOpen, loadOfflineQueue]);

  // ── MODALS ──
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);

  // ── CUSTOMER MODAL ──
  const [newCustomerData, setNewCustomerData] = useState(initialCustomer);

  // ── INVOICE DATA ──
  const [invoiceData, setInvoiceData] = useState({
    saleId: null,
    invoiceNo: null,
    signedUrl: null,
    customerPhone: null,
    totalAmount: null,
  });

  // ── PENDING ACTIONS ──

  // ============ CALLBACKS ============

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Notify the seller when a previously-offline sale syncs and an invoice is issued.
  // lastSyncResult is a new object reference on every sync, so this fires once per sync.
  useEffect(() => {
    if (!lastSyncResult || lastSyncResult.synced === 0) return;
    const invoiceNos = (lastSyncResult.results || [])
      .filter((r) => r.ok && r.response?.invoiceNumber)
      .map((r) => r.response.invoiceNumber);
    if (invoiceNos.length > 0) {
      const preview = invoiceNos.slice(0, 3).join(', ') + (invoiceNos.length > 3 ? '…' : '');
      showSnackbar(
        invoiceNos.length === 1
          ? `Offline sale synced! Invoice: ${preview}`
          : `${invoiceNos.length} offline sales synced! Invoices: ${preview}`,
        'success'
      );
    } else {
      showSnackbar(`${lastSyncResult.synced} offline sale(s) synced successfully`, 'success');
    }
  }, [lastSyncResult, showSnackbar]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedCustomer(null);
    setShowReviewPage(false);
    setSearchParams(initialSearchParams);
    setItem(initialItem);
    setSelectedVariant(null);
    setEditIndex(null);
    setSubstitutes([]);
  }, []);

  const handleLoadDraft = useCallback(
    async (id) => {
      setLoading(true);
      try {
        const res = await getSaleById(id);
        const draft = res.data;

        // SaleItemDto is FLAT — MapStruct doesn't nest itemVariant / item objects.
        // Read from top-level fields: si.id (aliased to itemVariantId via
        // @JsonProperty), si.itemName, si.variantSku, si.variantColor, etc.
        //
        // currentStock isn't exposed on the DTO (it's a runtime inventory value,
        // not a SaleItem column). Hydrate it from the `variants` list which the
        // Sales page has already loaded — matching by variant id.
        const variantById = new Map((variants || []).map((v) => [Number(v.id), v]));

        const resumedItems = (draft.items || []).map((si) => {
          // Prefer the true SaleItem PK (`saleItemId`) added by the F5 refactor,
          // fall back to the JSON-aliased `id` (variantId) for legacy drafts.
          const variantId =
            si.itemVariantId != null ? si.itemVariantId
            : si.id != null ? si.id                    // legacy: id was aliased to itemVariantId
            : si.itemId != null ? si.itemId : null;
          const liveVariant = variantId != null ? variantById.get(Number(variantId)) : null;
          const displayName = si.itemName || liveVariant?.itemName || 'Item';

          return {
            // Cart lines carry the variant id under both `id` and `variantId`
            // — several downstream consumers read one or the other historically.
            id: variantId ? Number(variantId) : null,
            variantId: variantId ? Number(variantId) : null,
            saleItemId: si.saleItemId != null ? si.saleItemId : null,
            sku: si.variantSku || liveVariant?.sku || '',
            qty: Number(si.qty || 0),
            unitPrice: Number(si.unitPrice || 0),
            itemName: displayName,
            description: '',
            color: si.variantColor || liveVariant?.color || '',
            size: si.variantSize || liveVariant?.size || '',
            brand: si.variantBrand || liveVariant?.brand || '',
            design: si.variantDesign || liveVariant?.design || '',
            gstRate: Number(si.gstRate || liveVariant?.gstRate || 0),
            hsn: liveVariant?.hsn || liveVariant?.hsnCode || null,
            // currentStock hydrated from live variants — the DTO doesn't carry it,
            // so if we don't do this we'd render 0 and trigger a false out-of-stock
            // guard when the user changes qty.
            currentStock: Number(liveVariant?.currentStock ?? 0),
            discount: Number(si.discount || 0),
            batchNumber: si.batchNumber || null,
            expiryDate: si.expiryDate || null,
            // Custom line fields (variant-less service billing).
            customItemName: si.customItemName || null,
            customDescription: si.customDescription || null,
            customHsnSac: si.customHsnSac || null,
            customUnit: si.customUnit || null,
            isCustom: !variantId,
          };
        });

        if (draft.customer) {
          setSelectedCustomer({
            value: draft.customer.id,
            label: `${draft.customer.name} | Phone: ${draft.customer.phone || 'N/A'}`,
            ...draft.customer,
          });
        }

        setFormData((prev) => ({
          ...prev,
          id: draft.id,
          customerId: draft.customer?.id || '',
          items: resumedItems,
          isGstRequired: draft.isGstRequired ? 'yes' : 'no',
          discount: draft.discount || 0,
          totalAmount: draft.totalAmount || 0,
          deliveryRequired: !!draft.delivery,
          deliveryAddress: draft.delivery?.deliveryAddress || '',
          deliveryCharge: draft.delivery?.deliveryCharge || '',
          deliveryStatus: draft.delivery?.deliveryStatus || 'PACKED',
          deliveryPaidBy: draft.delivery?.deliveryPaidBy || '',
        }));

        setShowReviewPage(false);
        clearParams();
        showSnackbar(t('salesPage.draftLoaded'), 'success');
      } catch (err) {
        console.error('Resume Error:', err);
        showSnackbar(t('salesPage.errorLoad'), 'error');
      } finally {
        setLoading(false);
      }
    },
    [clearParams, showSnackbar, t, variants]
  );

  useEffect(() => {
    if (resumeId) handleLoadDraft(resumeId);
  }, [resumeId, handleLoadDraft]);

  // ── ITEM MANAGEMENT ──

  const handleVariantSelect = useCallback((opt) => {
    if (!opt) {
      // Clear-selection path (Autocomplete's X, Escape, or explicit deselect):
      // wipe the highlighted variant AND the in-progress Qty/Discount/details
      // it drives, otherwise the ItemDetails card below the search bar hangs
      // around with stale data and the X appears to do nothing.
      setSelectedVariant(null);
      setItem(initialItem);
      setSubstitutes([]);
      setItemError('');
      return;
    }

    setSelectedVariant(opt);
    setItem({
      ...initialItem,
      id: opt.id,
      sku: opt.sku,
      qty: '1',
      unitPrice: opt.pricePerUnit,
      itemName: opt.itemName,
      color: opt.color,
      size: opt.size,
      currentStock: opt.currentStock,
      mrp: opt.mrp || null,
      gstRate: opt.gstRate || 0,
      // Preserve HSN/SAC so the cart row can display it inline for compliance visibility.
      hsn: opt.hsn || opt.hsnCode || null,
      weightGrams: opt.weightGrams || null,
      netWeightGrams: opt.netWeightGrams || null,
      metalPurity: opt.metalPurity || null,
      hallmarkNo: opt.hallmarkNo || null,
      makingChargesPerGram: opt.makingChargesPerGram || null,
      makingChargesPct: opt.makingChargesPct || null,
      stoneWeightCarats: opt.stoneWeightCarats || null,
      serialNumber: opt.serialNumber || null,
      warrantyMonths: opt.warrantyMonths || null,
      partNumber: opt.partNumber || null,
      partOrigin: opt.partOrigin || null,
    });

    // Load substitutes if out of stock
    if (opt.itemId && opt.currentStock < 1) {
      fetchItemSubstitutes(opt.itemId)
        .then((data) => setSubstitutes(Array.isArray(data) ? data : []))
        .catch(() => setSubstitutes([]));
    } else {
      setSubstitutes([]);
    }
  }, []);

  const handleAddItem = useCallback(() => {
    setItemError('');
    const quantity = Number(item.qty);

    if (!item.id || isNaN(quantity) || quantity <= 0) {
      setItemError('Invalid quantity.');
      return;
    }

    const availableStock = item.currentStock || (variants.find((v) => v.id === item.id)?.currentStock || 0);
    if (quantity > availableStock) {
      setItemError(`Stock Limit: Only ${availableStock} available.`);
      return;
    }

    doAddItem({ ...item, qty: quantity });
  }, [item, selectedVariant, variants]);

  const doAddItem = useCallback(
    (itemToAdd) => {
      // Functional updater so rapid consecutive adds never drop a line due to
      // stale closure over formData.items.
      setFormData((prev) => {
        let newItems;
        if (editIndex !== null) {
          newItems = [...prev.items];
          newItems[editIndex] = itemToAdd;
        } else {
          const existingIdx = prev.items.findIndex((it) => it.id === itemToAdd.id);
          if (existingIdx !== -1) {
            newItems = [...prev.items];
            newItems[existingIdx] = { ...newItems[existingIdx], qty: newItems[existingIdx].qty + itemToAdd.qty };
          } else {
            newItems = [...prev.items, itemToAdd];
          }
        }
        return { ...prev, items: newItems };
      });
      setItem(initialItem);
      setSelectedVariant(null);
      setEditIndex(null);
      setSubstitutes([]);
    },
    [editIndex]
  );

  const handleEditItem = useCallback(
    (index) => {
      const editItem = formData.items[index];
      setItem({ ...editItem, qty: String(editItem.qty) });
      setSelectedVariant(variants.find((v) => v.id === editItem.id) || null);
      setEditIndex(index);
    },
    [formData.items, variants]
  );

  const handleRemoveItem = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // Add a free-text (service / one-off charge) line item — no catalog variant, no stock.
  const handleAddCustomItem = useCallback(
    (payload) => {
      const customItem = {
        id: null,                                     // itemVariantId=null signals custom to backend
        itemName: payload.customItemName,             // satisfies @NotBlank on backend DTO
        customItemName: payload.customItemName,
        customDescription: payload.customDescription,
        customHsnSac: payload.customHsnSac,
        customUnit: payload.customUnit,
        qty: payload.qty,
        unitPrice: payload.unitPrice,
        gstRate: payload.gstRate,
        discount: 0,
        isCustom: true,                               // client-side flag to render differently in the list
      };
      setFormData((prev) => ({ ...prev, items: [...prev.items, customItem] }));
    },
    []
  );

  // ── CUSTOMER MANAGEMENT ──

  const handleCustomerSelect = useCallback(
    (opt) => {
      setSelectedCustomer(opt);
      setFormData((prev) => ({
        ...prev,
        customerId: opt?.value || '',
      }));
    },
    []
  );

  const handleNewCustomer = useCallback(async () => {
    const rawName = (newCustomerData.name || '').trim();
    if (!rawName) {
      showSnackbar('Customer name is required.', 'error');
      return;
    }

    let cleanPhone = (newCustomerData.phone || '').trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      showSnackbar('Phone number must be exactly 10 digits.', 'error');
      return;
    }

    const payload = {
      ...newCustomerData,
      name: rawName,
      phone: cleanPhone || null,
      email: newCustomerData.email?.trim() || null,
      gstNumber: newCustomerData.gstNumber?.trim().toUpperCase() || null,
      panNumber: newCustomerData.panNumber?.trim().toUpperCase() || null,
      addressLine1: newCustomerData.addressLine1?.trim() || null,
      addressLine2: newCustomerData.addressLine2?.trim() || null,
      city: newCustomerData.city?.trim() || null,
      state: newCustomerData.state?.trim() || null,
      postalCode: newCustomerData.postalCode?.trim() || null,
      notes: newCustomerData.notes?.trim() || null,
    };

    if (isOffline) {
      // Offline: create a local-only customer — id is null so the backend treats it
      // as a walk-in with name when the sale eventually syncs via offline queue.
      const localCust = {
        id: null,
        value: null,
        label: `${payload.name}${payload.phone ? ` | ${payload.phone}` : ''}`,
        name: payload.name,
        phone: payload.phone || '',
        isLocalOnly: true,
      };
      setCustomers((prev) => [...prev, localCust]);
      setSelectedCustomer(localCust);
      // customerId stays null — the offline sale payload sends customerName instead.
      setFormData((prev) => ({ ...prev, customerId: null }));
      setOpenCustomerModal(false);
      setNewCustomerData(initialCustomer);
      showSnackbar('Customer saved locally — will sync when back online.', 'info');
      return;
    }
    try {
      const res = await createCustomer(payload);
      const createdData = res.data || res;
      const newCust = { value: createdData.id, label: createdData.name, ...createdData };
      setCustomers((prev) => [...prev, newCust]);
      setSelectedCustomer(newCust);
      setFormData((prev) => ({ ...prev, customerId: createdData.id }));
      setOpenCustomerModal(false);
      setNewCustomerData(initialCustomer);
      showSnackbar('Customer added!', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add customer.';

      // Check if duplicate customer error contains existing customer id
      const idMatch = msg.match(/id=(\d+)/);
      if (idMatch && idMatch[1]) {
        const existingId = Number(idMatch[1]);
        try {
          const fetched = await fetchCustomer(existingId);
          const existingData = fetched.data || fetched;
          const existingCust = { value: existingData.id, label: existingData.name, ...existingData };
          setCustomers((prev) => {
            const exists = prev.some((c) => c.value === existingId || c.id === existingId);
            return exists ? prev : [...prev, existingCust];
          });
          setSelectedCustomer(existingCust);
          setFormData((prev) => ({ ...prev, customerId: existingId }));
          setOpenCustomerModal(false);
          setNewCustomerData(initialCustomer);
          showSnackbar(`Customer '${existingData.name}' already exists — selected!`, 'info');
          return;
        } catch (_) {
          // If fetching existing fails, show the error message
        }
      }

      showSnackbar(msg, 'error');
    }
  }, [isOffline, newCustomerData, showSnackbar]);

  // ── SALE SUBMISSION ──

  const handleSaveDraft = useCallback(async () => {
    setLoading(true);

    const payload = buildSalePayload(formData, selectedCustomer, [], 'DRAFT');

    try {
      const res = await draftSale(payload);
      setFormData((prev) => ({ ...prev, id: res.data.id }));
      showSnackbar(t('salesPage.draftSaved'), 'success');
    } catch {
      showSnackbar('Failed to save draft', 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, selectedCustomer, showSnackbar, t]);

  /**
   * "Hold this order" — POS staple. Save-as-draft first (persists the cart with
   * an id), then flip DRAFT → HELD on the server, then reset the form so the
   * cashier can serve the next customer. Held orders show up in Sales History
   * with a Resume affordance.
   */
  const handleHoldSale = useCallback(async () => {
    if (!formData.items?.length) {
      showSnackbar('Add at least one item before holding', 'warning');
      return;
    }
    setLoading(true);
    try {
      const draftPayload = buildSalePayload(formData, selectedCustomer, [], 'DRAFT');
      const draftRes = await draftSale(draftPayload);
      const saleId = draftRes?.data?.id;
      if (!saleId) throw new Error('Draft id missing in response');
      await parkSaleApi(saleId);
      showSnackbar('Order held — find it in Sales History', 'success');
      resetForm();
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to hold order', 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, selectedCustomer, resetForm, showSnackbar]);

  // Non-binding proforma: creates the sale immediately as a real (non-DRAFT) row
  // but with saleType=PROFORMA so the backend skips stock deduction and ledger
  // posting. No payment collection needed — proformas exist to be shared with
  // the customer for approval before a real invoice is issued.
  const handleSaveAsProforma = useCallback(async () => {
    setLoading(true);
    // Proforma is a distinct sale type — createSale builds a fresh row rather
    // than promoting the draft in place. Track the previous draft id so we can
    // clean it up after the proforma is safely created (otherwise the draft
    // would linger as an orphan in Sales History).
    const previousDraftId = formData.id || null;
    const payload = {
      ...buildSalePayload(formData, selectedCustomer, [], 'COMPLETED'),
      id: null,                // force createSale to mint a new row, not update the draft
      saleType: 'PROFORMA',
    };
    try {
      const res = await createSale(payload);
      // Best-effort orphan cleanup — if the discard fails, we still succeed
      // (user just sees a stray draft they can delete manually).
      if (previousDraftId) {
        try { await discardDraftSale(previousDraftId); }
        catch (e) { /* non-fatal */ }
      }
      setInvoiceData({
        saleId: res.data.id,
        invoiceNo: res.data.invoiceNo,
        signedUrl: res.data.signedInvoiceUrl,
        customerPhone: selectedCustomer?.phone || null,
        totalAmount: res.data.totalAmount ?? formData.totalAmount ?? null,
      });
      resetForm();
      setOpenInvoiceModal(true);
      showSnackbar(`Proforma ${res.data.invoiceNo} generated`, 'success');
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to generate proforma', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedCustomer, showSnackbar]);

  const handleSubmitSale = useCallback(
    async (payload) => {
      if (!payload) {
        setShowReviewPage(false);
        return;
      }

      if (payload.offline) {
        resetForm();
        setShowReviewPage(false);
        clearParams();
        showSnackbar(
          payload.offlineSaleNo
            ? `Offline sale (${payload.offlineSaleNo}) recorded! Will automatically sync when online.`
            : 'Offline sale recorded! Will automatically sync when online.',
          'success'
        );
        return;
      }

      setLoading(true);
      try {
        const res = payload.id
          ? await completeDraftSale(payload.id, payload)
          : await createSale(payload);

        setInvoiceData({
          saleId: res.data.id,
          invoiceNo: res.data.invoiceNo,
          signedUrl: res.data.signedInvoiceUrl,
          customerPhone: selectedCustomer?.phone || null,
          totalAmount: res.data.totalAmount ?? formData.totalAmount ?? null,
        });

        resetForm();
        setShowReviewPage(false);
        setOpenInvoiceModal(true);
        clearParams();

        showSnackbar(`Sale #${res.data.invoiceNo} completed!`, 'success');
      } catch (err) {
        if (err.response?.status === 402 || err.response?.data?.code === 'FEATURE_RESTRICTED') {
          setUpgradeModalData({
            open: true,
            upgradeOptions: err.response?.data?.upgradeOptions || { canStartTrial: canStartTrial(), trialDays: 14 },
            message: err.response?.data?.message || null,
            feature: err.response?.data?.feature || null,
          });
        } else {
          showSnackbar(err.response?.data?.message || 'Error processing sale.', 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [formData, selectedCustomer, resetForm, clearParams, showSnackbar, canStartTrial]
  );

  const handleCloseUpgradeModal = useCallback((wasTrialActivated) => {
    setUpgradeModalData({ open: false, upgradeOptions: null, message: null, feature: null });
    if (wasTrialActivated) {
      showSnackbar('14-Day Free Trial Activated! You can now complete your sale.', 'success');
    }
  }, [showSnackbar]);

  const handleSaveDraftFromModal = useCallback(async () => {
    await handleSaveDraft();
    setTabValue(1);
  }, [handleSaveDraft, setTabValue]);

  const handleCloseInvoiceModal = useCallback(() => {
    setOpenInvoiceModal(false);
    setInvoiceData({
      saleId: null,
      invoiceNo: null,
      signedUrl: null,
      customerPhone: null,
      totalAmount: null,
    });
    loadVariants();
  }, [loadVariants]);

  // ============ MEMOIZED VALUES ============

  const memoizedFilterOptions = useMemo(() => ({
    names: generateFilterOptions(variants, 'name', false),
    skus: generateFilterOptions(variants, 'sku'),
    colors: generateFilterOptions(variants, 'color'),
    sizes: generateFilterOptions(variants, 'size'),
    designs: generateFilterOptions(variants, 'design'),
    categories: generateFilterOptions(variants, 'categoryName'),
    attribute1: generateFilterOptions(variants, 'attribute1'),
    attribute2: generateFilterOptions(variants, 'attribute2'),
    fits: generateFilterOptions(variants, 'fit'),
  }), [variants]);

  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (searchParams.name && v.itemName !== searchParams.name) return false;
      if (searchParams.sku && v.sku !== searchParams.sku) return false;
      if (searchParams.color?.length > 0 && !searchParams.color.includes(v.color)) return false;
      if (searchParams.size?.length > 0 && !searchParams.size.includes(v.size)) return false;
      if (searchParams.design && v.design !== searchParams.design) return false;
      if (searchParams.category && v.categoryName !== searchParams.category) return false;
      if (searchParams.attribute1 && v.attribute1 !== searchParams.attribute1) return false;
      if (searchParams.attribute2 && v.attribute2 !== searchParams.attribute2) return false;
      if (searchParams.fit && v.fit !== searchParams.fit) return false;
      return true;
    });
  }, [variants, searchParams]);

  const isDeliveryOk = useMemo(() => isDeliveryValid(formData), [formData]);

  // Monthly sales quota chip — only renders when a finite cap exists.
  const usedThisMonth = subscription?.salesUsedThisMonth ?? null;
  const maxThisMonth = subscription?.maxSalesPerMonth ?? null;
  const showQuotaChip = usedThisMonth != null && maxThisMonth != null && maxThisMonth > 0;
  const quotaColor = showQuotaChip
    ? (usedThisMonth >= maxThisMonth ? 'error' : usedThisMonth >= maxThisMonth * 0.8 ? 'warning' : 'default')
    : 'default';

  // ============ RENDER ============

  const isLoading = loading || loadingCustomers;

  if (error) {
    return <ErrorState error={error} onRetry={handleLoadSalesData} />;
  }

  return (
    <Box sx={{
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      height: { xs: 'auto', md: outerHeight },
      minHeight: { xs: '100vh', md: 'auto' },
      overflow: { xs: 'auto', md: 'hidden' }
    }}>
      {!canProcessSale() && (
        <Alert
          severity="warning"
          icon={<LockIcon sx={{ color: '#f59e0b' }} />}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              {canStartTrial() && (
                <Button color="inherit" size="small" variant="contained" onClick={() => setUpgradeModalData({ open: true, upgradeOptions: { canStartTrial: true, trialDays: 14 }, message: null, feature: 'CAN_PROCESS_SALE' })} sx={{ bgcolor: '#f59e0b', color: '#000', fontWeight: 800, textTransform: 'none' }}>
                  Activate 14-Day Trial
                </Button>
              )}
              <Button color="inherit" size="small" variant="outlined" onClick={() => navigate('/pricing')} sx={{ textTransform: 'none' }}>
                View Plans
              </Button>
            </Stack>
          }
          sx={{ borderRadius: 0, borderBottom: '1px solid rgba(245, 158, 11, 0.3)', bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', py: 0.5, px: 2 }}
        >
          🔒 <strong>Sales Restriction Notice:</strong> Direct sale completion is restricted under your current plan configuration. You can save sales as draft or activate a 14-day full access trial to process sales immediately.
        </Alert>
      )}

      <SalesTabs
        value={tabValue}
        onChange={(newValue) => {
          setTabValue(newValue);
          if (newValue === 1) setHistoryRefreshKey(k => k + 1);
        }}
        rightSlot={
          <Stack direction="row" spacing={1} alignItems="center">
            {(isOffline || pendingCount > 0 || isSyncing) && (
              <Tooltip
                title={
                  isOffline
                    ? (pendingCount > 0 ? `${pendingCount} sale${pendingCount !== 1 ? 's' : ''} queued offline — click to view` : 'You are offline')
                    : isSyncing
                      ? 'Syncing offline sales to server…'
                      : `${pendingCount} offline sale${pendingCount !== 1 ? 's' : ''} pending — click to view`
                }
                arrow
              >
                <Chip
                  size="small"
                  color={isOffline ? 'warning' : 'info'}
                  variant="filled"
                  icon={isSyncing ? <CircularProgress size={16} color="inherit" /> : undefined}
                  label={
                    isOffline
                      ? (pendingCount > 0 ? `⚠ Offline (${pendingCount})` : '⚠ Offline')
                      : isSyncing
                        ? 'Syncing…'
                        : `↑ ${pendingCount} pending`
                  }
                  onClick={() => {
                    if (pendingCount > 0) setOfflineDrawerOpen(true);
                    else if (!isSyncing) syncNow();
                  }}
                  sx={{ fontWeight: 700, cursor: 'pointer' }}
                />
              </Tooltip>
            )}
            {showQuotaChip && (
              <Tooltip title={`${usedThisMonth} of ${maxThisMonth} sales used this month`} arrow>
                <Chip
                  size="small"
                  color={quotaColor}
                  variant={quotaColor === 'default' ? 'outlined' : 'filled'}
                  label={`${usedThisMonth} / ${maxThisMonth} this month`}
                  sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                />
              </Tooltip>
            )}
          </Stack>
        }
      />

      <SalesTabs.Panel value={tabValue} index={0} noPadding>
        {isLoading && !showReviewPage ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            minHeight: '200px'
          }}>
            <CircularProgress color="primary" />
          </Box>
        ) : !showReviewPage ? (
          <Box sx={{
            display: { xs: 'block', md: 'flex' },
            gap: 1.5,
            height: { xs: 'auto', md: '100%' },
            overflow: { xs: 'visible', md: 'hidden' },
            px: { xs: 1, md: 0 },
            pt: { xs: 1, md: 0 },
          }}>
             {/* LEFT PANEL */}
             <Paper elevation={0} sx={{
               flex: { md: '0 0 50%' },
               width: { xs: '100%', md: '50%' },
               borderRadius: 2,
               border: '1px solid',
               borderColor: 'divider',
               overflow: 'auto',
               mb: { xs: 1.5, md: 0 },
               bgcolor: 'background.paper',
             }}>
              <ErrorBoundary>
              <ItemSection
                variants={filteredVariants}
                selectedVariant={selectedVariant}
                item={item}
                setItem={setItem}
                uniqueNames={memoizedFilterOptions.names}
                uniqueSkus={memoizedFilterOptions.skus}
                uniqueColors={memoizedFilterOptions.colors}
                uniqueSizes={memoizedFilterOptions.sizes}
                uniqueDesigns={memoizedFilterOptions.designs}
                uniqueCategory={memoizedFilterOptions.categories}
                uniqueAttribute1={memoizedFilterOptions.attribute1}
                uniqueAttribute2={memoizedFilterOptions.attribute2}
                uniqueFits={memoizedFilterOptions.fits}
                handleResetFilters={() => setSearchParams(initialSearchParams)}
                searchParams={searchParams}
                handleVariantSelect={handleVariantSelect}
                handleSearchParamChange={(field, opt) =>
                  setSearchParams(prev => ({
                    ...prev,
                    [field]: opt?.value || (field === 'color' || field === 'size' ? [] : '')
                  }))
                }
                handleAddItem={handleAddItem}
                handleAddCustomItem={handleAddCustomItem}
                showSnackbar={showSnackbar}
                error={itemError}
                editIndex={editIndex}
                substitutes={substitutes}
                industryType={industryType}
                onSelectSubstitute={(sub) => {
                  handleVariantSelect(sub);
                  doAddItem({
                    ...initialItem,
                    id: sub.id,
                    sku: sub.sku,
                    qty: 1,
                    unitPrice: sub.pricePerUnit,
                    itemName: sub.itemName,
                    currentStock: sub.currentStock,
                  });
                }}
              />
              </ErrorBoundary>
            </Paper>

             {/* RIGHT PANEL — one unified Paper, three sections separated by hairline dividers */}
             <Paper elevation={0} sx={{
               flex: { md: '0 0 50%' },
               width: { xs: '100%', md: '50%' },
               display: 'flex',
               flexDirection: 'column',
               overflow: { xs: 'visible', md: 'hidden' },
               borderRadius: 2,
               border: '1px solid',
               borderColor: 'divider',
               bgcolor: 'background.paper',
              }}>
                {/* Customer & Options Section */}
                <Box sx={{
                  p: 1,
                  pb: 0.75,
                  flexShrink: 0,
                  width: '100%',
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.65 }}>
                   <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                   <Typography variant="caption" sx={{
                     fontWeight: 700,
                     fontSize: '0.65rem',
                     textTransform: 'uppercase',
                     letterSpacing: 0.4,
                     color: 'text.secondary',
                   }}>
                     Customer & Setup
                   </Typography>
                 </Box>
                 <CustomerSection
                   compact
                   customers={customers}
                   selectedCustomer={selectedCustomer}
                   formData={formData}
                   setFormData={setFormData}
                   newCustomerData={newCustomerData}
                   setNewCustomerData={setNewCustomerData}
                   handleCustomerSelect={handleCustomerSelect}
                   handleNewCustomer={handleNewCustomer}
                   openCustomerModal={openCustomerModal}
                   setOpenCustomerModal={setOpenCustomerModal}
                     isJewellery={isJewellery}
                 />
               </Box>

               {/* Cart section */}
              <Box sx={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}>
                <ErrorBoundary>
                  <SalesSummary
                    embedded
                    hideActions
                    formData={formData}
                    handleRemoveItem={handleRemoveItem}
                    handleEditItem={handleEditItem}
                    handleSaveDraft={handleSaveDraft}
                    loading={loading}
                    setFormData={setFormData}
                    selectedCustomer={selectedCustomer}
                    setShowReviewPage={setShowReviewPage}
                    isJewellery={isJewellery}
                  />
                </ErrorBoundary>
              </Box>

               {/* Sale-level notes — free-text metadata, persisted alongside the
                   sale. Distinct from customer.notes and delivery.deliveryNotes.
                   Collapsed by default; expands to a textarea on click and stays
                   open while there's content. */}
               <Box sx={{ px: 1, pb: 0.75, pt: 0.5, borderTop: '1px solid', borderTopColor: 'divider' }}>
                {(notesExpanded || formData.saleNotes) ? (
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={1}
                    maxRows={3}
                    placeholder="Notes on this sale (optional)"
                    value={formData.saleNotes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, saleNotes: e.target.value }))}
                    onBlur={() => { if (!formData.saleNotes) setNotesExpanded(false); }}
                    autoFocus={notesExpanded && !formData.saleNotes}
                    inputProps={{ maxLength: 1000 }}
                  />
                ) : (
                  <Button
                    onClick={() => setNotesExpanded(true)}
                    variant="text"
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                  >
                    Add note
                  </Button>
                )}
              </Box>

              {/* Action bar */}
              <ActionBar
                formData={formData}
                selectedCustomer={selectedCustomer}
                isDeliveryValid={isDeliveryOk}
                loading={loading}
                onClear={resetForm}
                onDraft={handleSaveDraft}
                onProforma={handleSaveAsProforma}
                onHold={handleHoldSale}
                onProceed={() => {
                  setShowReviewPage(true);
                }}
              />
            </Paper>
          </Box>
        ) : (
          <ErrorBoundary>
            <ReviewPaymentPage
              formData={formData}
              selectedCustomer={selectedCustomer}
              onConfirm={handleSubmitSale}
              onSaveDraft={handleSaveDraft}
              onCancel={() => setShowReviewPage(false)}
              setError={(msg) => showSnackbar(msg, 'error')}
              loading={loading}
              isJewellery={isJewellery}
            />
          </ErrorBoundary>
        )}

        <InvoiceModal
          open={openInvoiceModal}
          saleId={invoiceData.saleId}
          invoiceNo={invoiceData.invoiceNo}
          signedInvoiceUrl={invoiceData.signedUrl}
          customerPhone={invoiceData.customerPhone}
          totalAmount={invoiceData.totalAmount}
          shopName={shop?.name}
          onClose={handleCloseInvoiceModal}
        />
      </SalesTabs.Panel>

      <SalesTabs.Panel value={tabValue} index={1}>
        <ErrorBoundary>
          <SalesHistory
            onResume={handleLoadDraft}
            refreshTrigger={historyRefreshKey}
          />
        </ErrorBoundary>
      </SalesTabs.Panel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <EnterpriseUpgradeModal
        open={upgradeModalData.open}
        onClose={handleCloseUpgradeModal}
        upgradeOptions={upgradeModalData.upgradeOptions}
        message={upgradeModalData.message}
        feature={upgradeModalData.feature}
        onSaveDraft={handleSaveDraftFromModal}
      />

      {/* ── OFFLINE QUEUE DRAWER ── */}
      <Drawer
        anchor="bottom"
        open={offlineDrawerOpen}
        onClose={() => setOfflineDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
        }}>
          <Box>
            <Typography variant="h6" fontWeight={700} fontSize="1rem">
              ⚠ Offline Sales Queue
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {offlineQueueSales.length} sale{offlineQueueSales.length !== 1 ? 's' : ''} waiting to sync
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="warning"
              disabled={isSyncing || offlineQueueSales.length === 0}
              onClick={async () => {
                await syncNow();
                await loadOfflineQueue();
              }}
              startIcon={isSyncing ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </Button>
            <IconButton size="small" onClick={() => setOfflineDrawerOpen(false)}>
              ✕
            </IconButton>
          </Stack>
        </Box>

        {/* Body */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {offlineQueueLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : offlineQueueSales.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2">No pending offline sales found.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {offlineQueueSales.map((sale, idx) => {
                const statusColor = {
                  DRAFT: 'warning',
                  FAILED: 'error',
                  SYNCING: 'info',
                }[sale.status] || 'default';

                const amount = sale.totalAmount != null
                  ? `₹${Number(sale.totalAmount).toFixed(2)}`
                  : '—';

                const createdAt = sale.createdAt
                  ? new Date(sale.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                  : '—';

                const isExhausted = sale.status === 'FAILED' && (sale.retryCount ?? 0) >= 3;

                return (
                  <React.Fragment key={sale.clientTxnId}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ py: 1.5, px: 2.5 }}
                      secondaryAction={
                        isExhausted && (
                          <Tooltip title="Reset retry count so this sale can be re-synced">
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1.5 }}
                              onClick={async () => {
                                try {
                                  await resetFailedSale(sale.clientTxnId);
                                  await loadOfflineQueue();
                                } catch {
                                  showSnackbar('Failed to reset sale', 'error');
                                }
                              }}
                            >
                              Reset &amp; Retry
                            </Button>
                          </Tooltip>
                        )
                      }
                    >
                      <MuiListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700} fontSize="0.82rem">
                              {sale.offlineSaleNo || sale.clientTxnId?.slice(0, 8) + '…'}
                            </Typography>
                            <Chip
                              size="small"
                              color={statusColor}
                              label={sale.status}
                              sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap">
                            <Typography variant="caption" color="text.secondary">
                              {sale.customerName || 'Walk-in'}
                            </Typography>
                            <Typography variant="caption" fontWeight={700}>
                              {amount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {createdAt}
                            </Typography>
                            {sale.errorMessage && (
                              <Typography variant="caption" color="error.main">
                                ✕ {sale.errorMessage.slice(0, 60)}
                              </Typography>
                            )}
                            {sale.retryCount > 0 && (
                              <Typography variant="caption" color={isExhausted ? 'error.main' : 'text.secondary'}>
                                Retries: {sale.retryCount}{isExhausted ? ' — exhausted' : ''}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                    {idx < offlineQueueSales.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>

        {/* Footer hint */}
        <Box sx={{
          px: 2.5, py: 1.5,
          borderTop: '1px solid', borderColor: 'divider',
          bgcolor: 'action.hover',
          flexShrink: 0,
        }}>
          <Typography variant="caption" color="text.secondary">
            Sales sync automatically when you reconnect. You can also press "Sync Now" above.
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

// ============ SUB-COMPONENTS ============

/**
 * Action Bar Component
 *
 * Simplified: KPI mini-strip removed (redundant with cart above).
 * Draft + Proforma consolidated under a single "Save" split-button.
 * Clear reduced to icon-only. Proceed remains the sole primary CTA.
 */
const ActionBar = ({
  formData,
  selectedCustomer,
  isDeliveryValid,
  loading,
  onClear,
  onDraft,
  onProforma,
  onHold,
  onProceed,
}) => {
  const [saveMenuAnchor, setSaveMenuAnchor] = useState(null);
  const canSave = !!selectedCustomer && formData.items.length > 0 && !loading;
  // canProceed uses selectedCustomer (not formData.customerId) so that offline-created
  // customers (id=null) still allow the user to proceed to ReviewPaymentPage.
  const canProceed = canSave && isDeliveryValid;
  // Hold is more permissive than Save: it needs items but no customer (POS
  // typical "hold order while I look up the customer" workflow).
  const canHold = formData.items.length > 0 && !loading;

  const openSaveMenu = (e) => setSaveMenuAnchor(e.currentTarget);
  const closeSaveMenu = () => setSaveMenuAnchor(null);

  const proceedTooltip = !selectedCustomer
    ? 'Please select a customer'
    : !isDeliveryValid ? 'Complete delivery details' : '';

   return (
     <Box sx={{
       borderTop: '1px solid',
       borderTopColor: 'divider',
       p: 0.9,
       flexShrink: 0,
       display: 'flex',
       justifyContent: 'flex-end',
       alignItems: 'center',
       gap: 0.75,
       bgcolor: alpha('#0f766e', 0.01),
     }}>
       {!selectedCustomer && formData.items.length > 0 && (
         <Typography
           variant="caption"
           sx={{ color: 'error.main', fontWeight: 700, mr: 'auto', ml: 0.5, fontSize: '0.7rem' }}
         >
           Select a customer to continue
         </Typography>
       )}

       <Tooltip title="Clear cart">
         <span>
           <IconButton
             size="small"
             onClick={onClear}
             disabled={formData.items.length === 0}
             aria-label="Clear cart"
             sx={{ p: 0.5 }}
           >
             <DeleteSweepIcon fontSize="small" />
           </IconButton>
         </span>
       </Tooltip>

       {onHold && (
         <Tooltip title={canHold ? 'Park this cart to serve the next customer' : 'Add items to hold'}>
           <span>
             <Button
               variant="outlined"
               size="small"
               onClick={onHold}
               disabled={!canHold}
               sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: '0.75rem', px: 1.25, py: 0.4 }}
             >
               Hold
             </Button>
           </span>
         </Tooltip>
       )}

       <Tooltip title={canSave ? '' : 'Add customer and items to save'}>
         <span>
           <Button
             variant="outlined"
             size="small"
             onClick={onProforma ? openSaveMenu : onDraft}
             disabled={!canSave}
             endIcon={onProforma ? <ArrowDropDownIcon /> : null}
             startIcon={<SaveOutlinedIcon fontSize="small" />}
             sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: '0.75rem', px: 1.25, py: 0.4 }}
           >
             Save
           </Button>
         </span>
       </Tooltip>

       {onProforma && (
         <Menu
           anchorEl={saveMenuAnchor}
           open={Boolean(saveMenuAnchor)}
           onClose={closeSaveMenu}
           anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
           transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
         >
           <MenuItem onClick={() => { closeSaveMenu(); onDraft(); }}>
             <ListItemIcon><SaveOutlinedIcon fontSize="small" /></ListItemIcon>
             <ListItemText
               primary="Save as Draft"
               secondary="Resume later — no stock impact"
               primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8rem' }}
               secondaryTypographyProps={{ variant: 'caption', fontSize: '0.65rem' }}
             />
           </MenuItem>
           <MenuItem onClick={() => { closeSaveMenu(); onProforma(); }}>
             <ListItemIcon><DescriptionOutlinedIcon fontSize="small" /></ListItemIcon>
             <ListItemText
               primary="Generate Proforma"
               secondary="Share for customer approval"
               primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8rem' }}
               secondaryTypographyProps={{ variant: 'caption', fontSize: '0.65rem' }}
             />
           </MenuItem>
         </Menu>
       )}

       <Tooltip title={proceedTooltip}>
         <span>
           <Button
             variant="contained"
             size="small"
             color="primary"
             endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
             disabled={!canProceed}
             onClick={onProceed}
             sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, minWidth: 100, fontSize: '0.75rem', px: 1.5, py: 0.4 }}
           >
             {loading ? 'Processing...' : 'Proceed'}
           </Button>
         </span>
       </Tooltip>
     </Box>
   );
};

export default Sales;