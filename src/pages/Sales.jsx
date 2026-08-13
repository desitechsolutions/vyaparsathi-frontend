import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Snackbar, Alert, CircularProgress,
  Typography, Paper, Button, IconButton, Tooltip, Stack, Menu, MenuItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { buildSalePayload } from '../utils/salesUtils';
import {
  fetchCustomers, createSale, fetchItemVariants, createCustomer,
  draftSale, getSaleById, completeDraftSale, fetchItemSubstitutes,
  parkSale as parkSaleApi, discardDraftSale
} from '../services/api';
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
};

const initialSearchParams = {
  name: '', sku: '', color: [], size: [], design: '',
  category: '', fabric: '', season: '', fit: '',
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
 * Hook to load data
 */
const useLoadData = () => {
  const [variants, setVariants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const loadVariants = useCallback(() => {
    setLoading(true);
    fetchItemVariants({})
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setVariants(data.map((v) => ({
          value: v.id,
          label: `${v.itemName} (${v.color}, ${v.size}) - SKU: ${v.sku}`,
          ...v,
        })));
      })
      .catch(() => setVariants([]))
      .finally(() => setLoading(false));
  }, []);

  const loadCustomers = useCallback(() => {
    setLoadingCustomers(true);
    fetchCustomers()
      .then((res) => {
        setCustomers((res.data || []).map((cust) => ({
          value: cust.id,
          label: `${cust.name} | Phone: ${cust.phone || 'N/A'}`,
          ...cust,
        })));
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));
  }, []);

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
  const { getStatus, canProcessSale, canStartTrial } = useSubscription();
  const { tabValue, setTabValue, resumeId, clearParams } = useURLParams();

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
  } = useLoadData();

  // ── UI STATES ──
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [upgradeModalData, setUpgradeModalData] = useState({ open: false, upgradeOptions: null });

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
      setSubstitutes([]);
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
    try {
      const res = await createCustomer(newCustomerData);
      const newCust = { value: res.data.id, label: res.data.name, ...res.data };
      setCustomers((prev) => [...prev, newCust]);
      setSelectedCustomer(newCust);
      setFormData((prev) => ({ ...prev, customerId: res.data.id }));
      setOpenCustomerModal(false);
      showSnackbar('Customer added!', 'success');
    } catch {
      showSnackbar('Failed to add customer.', 'error');
    }
  }, [newCustomerData, showSnackbar]);

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
        setOpenInvoiceModal(true);
        clearParams();

        showSnackbar(`Sale #${res.data.invoiceNo} completed!`, 'success');
      } catch (err) {
        if (err.response?.status === 402 || err.response?.data?.code === 'FEATURE_RESTRICTED') {
          setUpgradeModalData({
            open: true,
            upgradeOptions: err.response?.data?.upgradeOptions || { canStartTrial: canStartTrial(), trialDays: 14 }
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
    setUpgradeModalData({ open: false, upgradeOptions: null });
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
    fabrics: generateFilterOptions(variants, 'fabric'),
    seasons: generateFilterOptions(variants, 'season'),
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
      if (searchParams.fabric && v.fabric !== searchParams.fabric) return false;
      if (searchParams.season && v.season !== searchParams.season) return false;
      if (searchParams.fit && v.fit !== searchParams.fit) return false;
      return true;
    });
  }, [variants, searchParams]);

  const isDeliveryOk = useMemo(() => isDeliveryValid(formData), [formData]);

  // ============ RENDER ============

  const isLoading = loading || loadingCustomers;

  return (
    <Box sx={{
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      height: outerHeight,
      overflow: 'hidden'
    }}>
      {!canProcessSale() && (
        <Alert
          severity="warning"
          icon={<LockIcon sx={{ color: '#f59e0b' }} />}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              {canStartTrial() && (
                <Button color="inherit" size="small" variant="contained" onClick={() => setUpgradeModalData({ open: true, upgradeOptions: { canStartTrial: true, trialDays: 14 } })} sx={{ bgcolor: '#f59e0b', color: '#000', fontWeight: 800, textTransform: 'none' }}>
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
            height: { md: '100%' },
            overflow: 'hidden',
            px: { xs: 1, md: 0 },
            pt: { xs: 1, md: 0 },
          }}>
            {/* LEFT PANEL */}
            <Paper elevation={0} sx={{
              flex: { md: '0 0 54%' },
              width: { xs: '100%', md: '54%' },
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
                uniqueFabrics={memoizedFilterOptions.fabrics}
                uniqueSeasons={memoizedFilterOptions.seasons}
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
              flex: { md: '0 0 46%' },
              width: { xs: '100%', md: '46%' },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              {/* Customer section */}
              <Box sx={{
                p: 1.5,
                flexShrink: 0,
                borderBottom: '1px solid',
                borderBottomColor: 'divider',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                  }}>
                    Customer
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
                  sale. Distinct from customer.notes and delivery.deliveryNotes. */}
              <Box sx={{ px: 2, pb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={1}
                  maxRows={3}
                  placeholder="Notes on this sale (optional)"
                  value={formData.saleNotes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, saleNotes: e.target.value }))}
                  inputProps={{ maxLength: 1000 }}
                />
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
        onSaveDraft={handleSaveDraftFromModal}
      />
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
  const canProceed = canSave && !!formData.customerId && isDeliveryValid;
  // Hold is more permissive than Save: it needs items but no customer (POS
  // typical "hold order while I look up the customer" workflow).
  const canHold = formData.items.length > 0 && !loading;

  const openSaveMenu = (e) => setSaveMenuAnchor(e.currentTarget);
  const closeSaveMenu = () => setSaveMenuAnchor(null);

  const proceedTooltip = !formData.customerId
    ? 'Please select a customer'
    : !isDeliveryValid ? 'Complete delivery details' : '';

  return (
    <Box sx={{
      borderTop: '1px solid',
      borderTopColor: 'divider',
      p: 1.25,
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 1,
    }}>
      {!formData.customerId && formData.items.length > 0 && (
        <Typography
          variant="caption"
          sx={{ color: 'error.main', fontWeight: 600, mr: 'auto', ml: 0.5 }}
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
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
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
            startIcon={<SaveOutlinedIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
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
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
          <MenuItem onClick={() => { closeSaveMenu(); onProforma(); }}>
            <ListItemIcon><DescriptionOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary="Generate Proforma"
              secondary="Share for customer approval"
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
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
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ChevronRightIcon />}
            disabled={!canProceed}
            onClick={onProceed}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, minWidth: 120 }}
          >
            {loading ? 'Processing...' : 'Proceed'}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

export default Sales;