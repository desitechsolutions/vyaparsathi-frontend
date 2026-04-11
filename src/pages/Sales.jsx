import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Snackbar, Alert, CircularProgress, Divider, Chip,
  Typography, Paper, Button, Tooltip, Stack, Dialog, DialogTitle, 
  DialogContent, DialogActions, alpha
} from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import { buildSalePayload } from '../utils/salesUtils';
import { 
  fetchCustomers, createSale, fetchItemVariants, createCustomer, 
  draftSale, getSaleById, completeDraftSale, fetchItemSubstitutes
} from '../services/api';
import { useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// ============ CONSTANTS ============
const initialItem = {
  id: '', sku: '', qty: '', unitPrice: 0, itemName: '', description: '',
  color: [], size: [], brand: '', design: '', currentStock: 0,
};

const initialCustomer = {
  name: '', phone: '', addressLine1: '', addressLine2: '', city: '',
  state: '', postalCode: '', country: '', gstNumber: '', panNumber: '',
  notes: '', creditBalance: 0, age: '', gender: '', isChronicPatient: false,
};

const initialFormData = {
  id: null, customerId: '', items: [], totalAmount: 0, isGstRequired: 'no',
  discount: 0, paymentMethods: [{ method: 'Cash', amount: 0 }],
  remaining: 0, paymentStatus: 'Pending', deliveryRequired: false,
  deliveryAddress: '', deliveryCharge: 0, deliveryPaidBy: null,
  deliveryNotes: '', deliveryStatus: 'PACKED',
  doctorName: '', doctorRegistrationNumber: '', patientName: '',
};

const initialSearchParams = {
  name: '', sku: '', color: [], size: [], design: '',
  category: '', fabric: '', season: '', fit: '', composition: '',
};

// ============ HELPER FUNCTIONS ============

/**
 * Generate unique filter options from variants
 */
const generateFilterOptions = (variants, field, isPharmacy = false) => {
  const baseOption = { value: '', label: `All ${field.charAt(0).toUpperCase() + field.slice(1)}s` };
  
  if (field === 'name' && isPharmacy) {
    const nameMap = new Map();
    variants.forEach(v => {
      if (v.itemName && !nameMap.has(v.itemName)) {
        nameMap.set(v.itemName, v.composition || '');
      }
    });
    return [
      baseOption,
      ...[...nameMap.entries()].map(([name, comp]) => ({
        value: name,
        label: comp ? `${name} (${comp})` : name,
      })),
    ];
  }

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

/**
 * Check if controlled drugs require prescription details
 */
const checkPrescriptionRequired = (items) => {
  return items.some(it => ['SCHEDULE_H1', 'SCHEDULE_X'].includes(it.drugSchedule));
};

/**
 * Validate prescription details
 */
const validatePrescriptionDetails = (formData) => {
  const missing = [];
  if (!formData.doctorName?.trim()) missing.push('Doctor Name');
  if (!formData.doctorRegistrationNumber?.trim()) missing.push('Doctor Reg. No.');
  if (!formData.patientName?.trim()) missing.push('Patient Name');
  return missing;
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
  const { isPharmacy, isJewellery, industryType, shop } = useShop();
  const { tabValue, setTabValue, resumeId, clearParams } = useURLParams();

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

  // ── MODALS ──
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [drugAlertOpen, setDrugAlertOpen] = useState(false);

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
  const [pendingItem, setPendingItem] = useState(null);

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

        const resumedItems = (draft.items || []).map((si) => {
          const actualVariantId = si.id || si.itemId || si.itemVariantId || si.itemVariant?.id;
          const v = si.itemVariant || {};
          const itemDetail = v.item || {};

          return {
            id: actualVariantId ? Number(actualVariantId) : null,
            variantId: actualVariantId ? Number(actualVariantId) : null,
            saleItemId: si.saleItemId || si.id,
            sku: v.sku || '',
            qty: Number(si.qty || 0),
            unitPrice: Number(si.unitPrice || 0),
            itemName: itemDetail.name || v.itemName || 'Item',
            description: itemDetail.description || '',
            color: v.color || '',
            size: v.size || '',
            brand: itemDetail.brandName || v.brand || '',
            design: v.design || '',
            currentStock: Number(v.currentStock || 0),
            discount: Number(si.discount || 0),
            drugSchedule: v.drugSchedule || '',
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
          ...(isPharmacy ? { patientName: draft.customer?.name || '' } : {}),
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
    [isPharmacy, clearParams, showSnackbar, t]
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
      drugSchedule: opt.drugSchedule,
      requiresPrescription: opt.requiresPrescription,
      mrp: opt.mrp || null,
      gstRate: opt.gstRate || 0,
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

    // Check drug schedule
    const schedule = item.drugSchedule || selectedVariant?.drugSchedule;
    if (isPharmacy && schedule && ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(schedule)) {
      setPendingItem({ ...item, qty: quantity });
      setDrugAlertOpen(true);
      return;
    }

    doAddItem({ ...item, qty: quantity });
  }, [item, selectedVariant, variants, isPharmacy]);

  const doAddItem = useCallback(
    (itemToAdd) => {
      let newItems;

      if (editIndex !== null) {
        newItems = [...formData.items];
        newItems[editIndex] = itemToAdd;
      } else {
        const existingIdx = formData.items.findIndex((it) => it.id === itemToAdd.id);
        if (existingIdx !== -1) {
          newItems = [...formData.items];
          newItems[existingIdx].qty += itemToAdd.qty;
        } else {
          newItems = [...formData.items, itemToAdd];
        }
      }

      setFormData((prev) => ({ ...prev, items: newItems }));
      setItem(initialItem);
      setSelectedVariant(null);
      setEditIndex(null);
      setSubstitutes([]);
    },
    [formData.items, editIndex]
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

  // ── CUSTOMER MANAGEMENT ──

  const handleCustomerSelect = useCallback(
    (opt) => {
      setSelectedCustomer(opt);
      setFormData((prev) => ({
        ...prev,
        customerId: opt?.value || '',
        ...(isPharmacy && opt ? { patientName: opt.name || opt.label?.split(' | ')[0] || '' } : {}),
      }));
    },
    [isPharmacy]
  );

  const handleNewCustomer = useCallback(async () => {
    try {
      const res = await createCustomer(newCustomerData);
      const newCust = { value: res.data.id, label: res.data.name, ...res.data };
      setCustomers((prev) => [...prev, newCust]);
      setSelectedCustomer(newCust);
      setFormData((prev) => ({ ...prev, customerId: res.data.id }));
      setOpenCustomerModal(false);
      showSnackbar(isPharmacy ? 'Patient registered!' : 'Customer added!', 'success');
    } catch {
      showSnackbar('Failed to add customer.', 'error');
    }
  }, [newCustomerData, isPharmacy, showSnackbar]);

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
        showSnackbar(err.response?.data?.message || 'Error processing sale.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [formData, selectedCustomer, resetForm, clearParams, showSnackbar]
  );

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
    names: generateFilterOptions(variants, 'name', isPharmacy),
    skus: generateFilterOptions(variants, 'sku'),
    colors: generateFilterOptions(variants, 'color'),
    sizes: generateFilterOptions(variants, 'size'),
    designs: generateFilterOptions(variants, 'design'),
    categories: generateFilterOptions(variants, 'categoryName'),
    fabrics: generateFilterOptions(variants, 'fabric'),
    seasons: generateFilterOptions(variants, 'season'),
    fits: generateFilterOptions(variants, 'fit'),
    compositions: generateFilterOptions(variants, 'composition'),
  }), [variants, isPharmacy]);

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
      if (searchParams.composition && v.composition !== searchParams.composition) return false;
      return true;
    });
  }, [variants, searchParams]);

  const isDeliveryOk = useMemo(() => isDeliveryValid(formData), [formData]);
  const isPrescriptionOk = useMemo(() => checkPrescriptionRequired(formData.items), [formData.items]);

  // ============ RENDER ============

  const isLoading = loading || loadingCustomers;

  return (
    <Box sx={{
      bgcolor: alpha('#0f766e', 0.04),
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 100px)',
      overflow: 'hidden'
    }}>
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
            height: 'calc(100vh - 250px)'
          }}>
            <CircularProgress sx={{ color: '#0f766e' }} />
          </Box>
        ) : !showReviewPage ? (
          <Box sx={{
            display: { xs: 'block', md: 'flex' },
            gap: 1.5,
            height: { md: 'calc(100vh - 158px)' },
            overflow: 'hidden',
            px: { xs: 1, md: 0 },
            pt: { xs: 1, md: 0 },
          }}>
            {/* LEFT PANEL */}
            <Paper elevation={0} sx={{
              flex: { md: '0 0 54%' },
              width: { xs: '100%', md: '54%' },
              borderRadius: 2,
              border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
              overflow: 'auto',
              mb: { xs: 1.5, md: 0 },
            }}>
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
                uniqueCompositions={memoizedFilterOptions.compositions}
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
                error={itemError}
                editIndex={editIndex}
                substitutes={substitutes}
                isPharmacy={isPharmacy}
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
                    drugSchedule: sub.drugSchedule
                  });
                }}
              />
            </Paper>

            {/* RIGHT PANEL */}
            <Box sx={{
              flex: { md: '0 0 46%' },
              width: { xs: '100%', md: '46%' },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              gap: 0,
            }}>
              {/* Customer Header */}
              <Paper elevation={0} sx={{
                borderRadius: '8px 8px 0 0',
                border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
                borderBottom: 'none',
                p: 1.5,
                flexShrink: 0,
                bgcolor: alpha('#0f766e', 0.02),
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" sx={{ color: '#0f766e' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f766e' }}>
                    {isPharmacy ? 'Patient' : 'Customer'}
                  </Typography>
                  {isPharmacy && (
                    <Chip
                      label="Rx"
                      size="small"
                      sx={{
                        ml: 1,
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: alpha('#dc2626', 0.1),
                        color: '#dc2626'
                      }}
                    />
                  )}
                  {isJewellery && (
                    <Chip
                      label="💎"
                      size="small"
                      sx={{
                        ml: 1,
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: alpha('#7c3aed', 0.1),
                        color: '#7c3aed'
                      }}
                    />
                  )}
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
                  isPharmacy={isPharmacy}
                  isJewellery={isJewellery}
                />
              </Paper>

              {/* Cart */}
              <Box sx={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
                borderTop: `1px solid ${alpha('#0f766e', 0.08)}`,
                bgcolor: '#fff',
              }}>
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
                  isPharmacy={isPharmacy}
                  isJewellery={isJewellery}
                />
              </Box>

              {/* Action Bar */}
              <ActionBar
                formData={formData}
                selectedCustomer={selectedCustomer}
                isDeliveryValid={isDeliveryOk}
                isPrescriptionRequired={isPrescriptionOk}
                loading={loading}
                onClear={resetForm}
                onDraft={handleSaveDraft}
                onProceed={() => {
                  if (isPrescriptionOk) {
                    const missing = validatePrescriptionDetails(formData);
                    if (missing.length > 0) {
                      showSnackbar(`Prescription required: ${missing.join(', ')}`, 'error');
                      return;
                    }
                  }
                  setShowReviewPage(true);
                }}
              />
            </Box>
          </Box>
        ) : (
          <ReviewPaymentPage
            formData={formData}
            selectedCustomer={selectedCustomer}
            onConfirm={handleSubmitSale}
            onSaveDraft={handleSaveDraft}
            onCancel={() => setShowReviewPage(false)}
            setError={(msg) => showSnackbar(msg, 'error')}
            loading={loading}
            isPharmacy={isPharmacy}
          />
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
        <SalesHistory
          onResume={handleLoadDraft}
          refreshTrigger={historyRefreshKey}
        />
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

      {/* Drug Alert Dialog */}
      <DrugAlertDialog
        open={drugAlertOpen}
        pendingItem={pendingItem}
        onCancel={() => {
          setDrugAlertOpen(false);
          setPendingItem(null);
        }}
        onConfirm={() => {
          setDrugAlertOpen(false);
          if (pendingItem) doAddItem(pendingItem);
          setPendingItem(null);
        }}
      />
    </Box>
  );
};

// ============ SUB-COMPONENTS ============

/**
 * Action Bar Component
 */
const ActionBar = ({
  formData,
  selectedCustomer,
  isDeliveryValid,
  isPrescriptionRequired,
  loading,
  onClear,
  onDraft,
  onProceed,
}) => (
  <Paper elevation={0} sx={{
    borderRadius: '0 0 8px 8px',
    border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
    borderTop: '2px solid #e2e8f0',
    p: 1.5,
    bgcolor: 'rgba(255,255,255,0.97)',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 1,
  }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: '#64748b',
            fontWeight: 800,
            display: 'block',
            lineHeight: 1,
            mb: 0.25
          }}
        >
          ITEMS
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: '#0f766e',
            lineHeight: 1
          }}
        >
          {String(formData.items.length).padStart(2, '0')}
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ height: 28 }} />
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: '#64748b',
            fontWeight: 800,
            display: 'block',
            lineHeight: 1,
            mb: 0.25
          }}
        >
          TOTAL
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            color: '#0f766e',
            lineHeight: 1
          }}
        >
          ₹{Number(formData.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      </Box>
    </Stack>

    <Stack direction="row" spacing={0.75} alignItems="center">
      <Tooltip title="Clear all items">
        <Button
          variant="text"
          size="small"
          onClick={onClear}
          disabled={formData.items.length === 0}
          sx={{
            minWidth: 0,
            px: 1,
            textTransform: 'none',
            fontWeight: 700
          }}
        >
          <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />
          Clear
        </Button>
      </Tooltip>

      <Tooltip title={!selectedCustomer || formData.items.length === 0 ? 'Need customer + items' : ''}>
        <span>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={onDraft}
            disabled={loading || formData.items.length === 0 || !selectedCustomer}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.75rem'
            }}
          >
            Draft
          </Button>
        </span>
      </Tooltip>

      {!formData.customerId && formData.items.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: '#dc2626',
            fontWeight: 700
          }}
        >
          Select customer
        </Typography>
      )}

      <Tooltip title={
        !formData.customerId ? 'Please select a customer' :
        !isDeliveryValid ? 'Complete delivery details' : ''
      }>
        <span>
          <Button
            variant="contained"
            size="small"
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ChevronRightIcon />}
            disabled={formData.items.length === 0 || !formData.customerId || !isDeliveryValid || loading}
            onClick={onProceed}
            sx={{
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 2,
              boxShadow: `0 4px 12px ${alpha('#0f766e', 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha('#0f766e', 0.4)}`,
              },
            }}
          >
            {loading ? 'Processing...' : 'Proceed'}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  </Paper>
);

/**
 * Drug Alert Dialog Component
 */
const DrugAlertDialog = ({ open, pendingItem, onCancel, onConfirm }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
    <DialogTitle sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      bgcolor: alpha('#dc2626', 0.1),
      color: '#dc2626',
      fontWeight: 800,
    }}>
      <WarningAmberIcon />
      {pendingItem?.drugSchedule === 'SCHEDULE_X' ? 'Narcotic Drug' : 'Controlled Drug'}
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Typography variant="body1" gutterBottom>
        <strong>{pendingItem?.itemName}</strong> is <strong>{pendingItem?.drugSchedule?.replace('_', ' ')}</strong>.
      </Typography>
      <Alert
        severity={pendingItem?.drugSchedule === 'SCHEDULE_X' ? 'error' : 'warning'}
        sx={{ mt: 2 }}
      >
        {pendingItem?.drugSchedule === 'SCHEDULE_X'
          ? 'Narcotics Register required. Prescription with doctor details must be valid.'
          : 'Valid prescription required. Verify before proceeding.'}
      </Alert>
      <Typography variant="body2" color="#64748b" sx={{ mt: 2 }}>
        Confirm that a valid prescription has been checked.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
      <Button onClick={onCancel} color="inherit">
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        sx={{
          bgcolor: '#0f766e',
          textTransform: 'none',
          fontWeight: 700
        }}
      >
        Confirm & Add
      </Button>
    </DialogActions>
  </Dialog>
);

export default Sales;