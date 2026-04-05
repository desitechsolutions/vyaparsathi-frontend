import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Snackbar, Alert, CircularProgress, Divider, Chip,
  Typography, Paper, Button, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SalesTabs from '../components/Sales/SalesTabs';
import CustomerSection from '../components/Sales/CustomerSection';
import ItemSection from '../components/Sales/ItemSection';
import SalesSummary from '../components/Sales/SalesSummary';
import InvoiceModal from '../components/Sales/InvoiceModal';
import SalesHistory from '../components/Sales/SalesHistory';
import ReviewPaymentPage from '../components/Sales/ReviewPaymentPage';
import { buildSalePayload }  from '../utils/salesUtils';
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


const initialItem = {
  id: '', sku: '', qty: '', unitPrice: 0, itemName: '', description: '',
  color: [], size: [], brand: '', design: '', currentStock: 0,
};

const initialCustomer = {
  name: '', phone: '', addressLine1: '', addressLine2: '', city: '',
  state: '', postalCode: '', country: '', gstNumber: '', panNumber: '',
  notes: '', creditBalance: 0,
  age: '', gender: '', isChronicPatient: false,
};

const initialFormData = {
  id: null, 
  customerId: '', items: [], totalAmount: 0, isGstRequired: 'no',
  discount: 0, paymentMethods: [{ method: 'Cash', amount: 0 }],
  remaining: 0, paymentStatus: 'Pending', deliveryRequired: false,
  deliveryAddress: '', deliveryCharge: 0, deliveryPaidBy: null,
  deliveryNotes: '', deliveryStatus: "PACKED",
  doctorName: '', doctorRegistrationNumber: '', patientName: '',
};

const Sales = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialFormData);
  const [item, setItem] = useState(initialItem);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
const [urlParams, setUrlParams] = useSearchParams();
const tabParam = urlParams.get("tab");
const tabValue = tabParam === "history" ? 1 : 0;

  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(initialCustomer);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [lastInvoiceNo, setLastInvoiceNo] = useState(null);
  const [signedInvoiceUrl, setSignedInvoiceUrl] = useState(null);
  const [lastCustomerPhone, setLastCustomerPhone] = useState(null);
  const [lastTotalAmount, setLastTotalAmount] = useState(null);
  const hasShownMissingUrlWarning = useRef(false);
  const resumeId = urlParams.get('resumeId');

  const [searchParams, setSearchParams] = useState({
    name: '', sku: '', color: [], size: [], design: '',
    category: '', fabric: '', season: '', fit: '', composition: '',
  });
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editIndex, setEditIndex] = useState(null);
  const [itemError, setItemError] = useState('');

  // Industry context
  const { isPharmacy, isJewellery, industryType, shop } = useShop();
  const [drugAlertOpen, setDrugAlertOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);

  // --- RESUME DRAFT LOGIC ---
  const handleLoadDraft = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await getSaleById(id);
      const draft = res.data;

      const resumedItems = (draft.items || []).map(si => {
        const actualVariantId = si.id || si.itemId || si.itemVariantId || (si.itemVariant && si.itemVariant.id);
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
          discount: Number(si.discount || 0)
        };
      });

      if (draft.customer) {
        setSelectedCustomer({
          value: draft.customer.id,
          label: `${draft.customer.name} | Phone: ${draft.customer.phone || 'N/A'}`,
          ...draft.customer
        });
      }

      setFormData(prev => ({
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
        deliveryPaidBy : draft.delivery?.deliveryPaidBy || ''
      }));

      setShowReviewPage(false);
      setUrlParams({}); 
      setSnackbar({ open: true, message: t('salesPage.draftLoaded'), severity: 'success' });

    } catch (err) {
      console.error("Resume Error:", err);
      setSnackbar({ open: true, message: t('salesPage.errorLoad'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [setUrlParams]);

  useEffect(() => {
    if (resumeId) handleLoadDraft(resumeId);
  }, [resumeId, handleLoadDraft]);

  useEffect(() => {
  if (!urlParams.get("tab")) {
    setUrlParams({ tab: "sale" }, { replace: true });
  }
}, []);
  const loadVariants = useCallback(() => {
    setLoading(true);
    fetchItemVariants({})
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setVariants(res.data.map((v) => ({
            value: v.id, 
            label: `${v.itemName} (${v.color}, ${v.size}) - SKU: ${v.sku}`, 
            ...v,
          })));
        } else { setVariants([]); }
      })
      .catch(() => setSnackbar({ open: true, message: t('salesPage.errorLoad'), severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadVariants();
    setLoadingCustomers(true);
    fetchCustomers()
      .then((res) => {
        setCustomers(res.data.map((cust) => ({
          value: cust.id, 
          label: `${cust.name} | Phone: ${cust.phone || 'N/A'}`, 
          ...cust,
        })));
      })
      .catch(() => setSnackbar({ open: true, message: t('salesPage.errorLoad'), severity: 'error' }))
      .finally(() => setLoadingCustomers(false));
  }, [loadVariants]);

  const handleCloseInvoiceModal = () => {
    setOpenInvoiceModal(false);
    setSignedInvoiceUrl(null);
    loadVariants();
  };

  // Memoized Search Options
  // Pharmacy: unique names include composition in label for smart search
  const uniqueNames = useMemo(() => {
    if (isPharmacy) {
      const nameMap = new Map();
      variants.forEach(v => {
        if (v.itemName && !nameMap.has(v.itemName)) {
          nameMap.set(v.itemName, v.composition || '');
        }
      });
      return [
        { value: '', label: 'All Names' },
        ...[...nameMap.entries()].map(([name, comp]) => ({
          value: name,
          label: comp ? `${name} (${comp})` : name,
        })),
      ];
    }
    return [{ value: '', label: 'All Names' }, ...[...new Set(variants.map(v => v.itemName).filter(Boolean))].map(n => ({ value: n, label: n }))];
  }, [variants, isPharmacy]);
  const uniqueSkus = useMemo(() => [{ value: '', label: 'All SKUs' }, ...[...new Set(variants.map(v => v.sku).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueColors = useMemo(() => [{ value: '', label: 'All Colors' }, ...[...new Set(variants.map(v => v.color).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueSizes = useMemo(() => [{ value: '', label: 'All Sizes' }, ...[...new Set(variants.map(v => v.size).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueDesigns = useMemo(() => [{ value: '', label: 'All Designs' }, ...[...new Set(variants.map(v => v.design).filter(Boolean))].map(d => ({ value: d, label: d }))], [variants]);
  const uniqueCategory = useMemo(() => [{ value: '', label: 'All Categories' }, ...[...new Set(variants.map(v => v.categoryName).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);
  const uniqueFabrics = useMemo(() => [{ value: '', label: 'All Fabrics' }, ...[...new Set(variants.map(v => v.fabric).filter(Boolean))].map(f => ({ value: f, label: f }))], [variants]);
  const uniqueSeasons = useMemo(() => [{ value: '', label: 'All Seasons' }, ...[...new Set(variants.map(v => v.season).filter(Boolean))].map(s => ({ value: s, label: s }))], [variants]);
  const uniqueFits = useMemo(() => [{ value: '', label: 'All Fits' }, ...[...new Set(variants.map(v => v.fit).filter(Boolean))].map(f => ({ value: f, label: f }))], [variants]);
  // Pharmacy-specific: unique active compositions
  const uniqueCompositions = useMemo(() => [{ value: '', label: 'All Compositions' }, ...[...new Set(variants.map(v => v.composition).filter(Boolean))].map(c => ({ value: c, label: c }))], [variants]);

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

  useEffect(() => {
    const newTotal = formData.items.reduce((sum, item) => sum + Number(item.qty) * item.unitPrice, 0);
    setFormData(prev => ({ ...prev, totalAmount: newTotal.toFixed(2) }));
  }, [formData.items]);

  const handleResetFilters = () => {
    setSearchParams({}); // Reset the URL/State params
    setSelectedVariant(null); // Reset the final select dropdown
    setItem({
      id: '', sku: '', qty: '', unitPrice: 0, itemName: '',
      description: '', color: '', size: '', brand: '', design: '', currentStock: 0,
    });
  };
      const isDeliveryValid = () => {
      // If delivery isn't checked, it's always "valid" to proceed
      if (!formData.deliveryRequired) return true;

      // If checked, ensure Address is not empty and "Paid By" is selected
      const hasAddress = formData.deliveryAddress?.trim().length > 0;
      const hasPaidBy = formData.deliveryPaidBy !== '' && formData.deliveryPaidBy !== null;

      return hasAddress && hasPaidBy;
    };
  const handleAddItem = () => {
    setItemError('');
    const quantity = Number(item.qty);
    if (!item.id || isNaN(quantity) || quantity <= 0) { setItemError('Invalid quantity.'); return; }

    const availableStock = item.currentStock || (variants.find(v => v.id === item.id)?.currentStock || 0);
    if (quantity > availableStock) {
      setItemError(`Stock Limit: Only ${availableStock} available.`);
      return;
    }

    // Show drug schedule warning for controlled drugs (pharmacy mode)
    const schedule = item.drugSchedule || selectedVariant?.drugSchedule;
    if (isPharmacy && schedule && ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(schedule)) {
      setPendingItem({ ...item, qty: quantity });
      setDrugAlertOpen(true);
      return;
    }

    doAddItem({ ...item, qty: quantity });
  };

  const doAddItem = (itemToAdd) => {
    let newItems;
    if (editIndex !== null) {
      newItems = [...formData.items];
      newItems[editIndex] = itemToAdd;
    } else {
      const existingIdx = formData.items.findIndex(it => it.id === itemToAdd.id);
      if (existingIdx !== -1) {
        newItems = [...formData.items];
        newItems[existingIdx].qty += itemToAdd.qty;
      } else {
        newItems = [...formData.items, itemToAdd];
      }
    }
    setFormData({ ...formData, items: newItems });
    setItem(initialItem); setSelectedVariant(null); setEditIndex(null); setSubstitutes([]);
  };

  const handleEditItem = (index) => {
    const editItem = formData.items[index];
    setItem({ ...editItem, qty: String(editItem.qty) });
    setSelectedVariant(variants.find(v => v.id === editItem.id) || null);
    setEditIndex(index);
  };

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleVariantSelect = (opt) => {
    if (opt) {
      setSelectedVariant(opt);
      setItem({
        ...initialItem, id: opt.id, sku: opt.sku, qty: '1', unitPrice: opt.pricePerUnit,
        itemName: opt.itemName, color: opt.color, size: opt.size, currentStock: opt.currentStock,
        drugSchedule: opt.drugSchedule, requiresPrescription: opt.requiresPrescription,
        // Issue 1 & 5: carry MRP and GST rate per variant
        mrp: opt.mrp || null,
        gstRate: opt.gstRate || 0,
        // Jewellery fields
        weightGrams: opt.weightGrams || null,
        netWeightGrams: opt.netWeightGrams || null,
        metalPurity: opt.metalPurity || null,
        hallmarkNo: opt.hallmarkNo || null,
        makingChargesPerGram: opt.makingChargesPerGram || null,
        makingChargesPct: opt.makingChargesPct || null,
        stoneWeightCarats: opt.stoneWeightCarats || null,
        // Electronics fields
        serialNumber: opt.serialNumber || null,
        warrantyMonths: opt.warrantyMonths || null,
        // Automobile fields
        partNumber: opt.partNumber || null,
        partOrigin: opt.partOrigin || null,
      });
      // Load substitutes when item is out of stock or has composition data
      if (opt.itemId && (opt.currentStock === 0 || opt.currentStock < 1)) {
        fetchItemSubstitutes(opt.itemId)
          .then(data => setSubstitutes(Array.isArray(data) ? data : []))
          .catch(() => setSubstitutes([]));
      } else {
        setSubstitutes([]);
      }
    } else {
      setSubstitutes([]);
    }
  };

  const handleCustomerSelect = (opt) => {
    setSelectedCustomer(opt);
    setFormData(prev => ({
      ...prev,
      customerId: opt?.value || '',
      // Issue 4: auto-populate patientName for pharmacy when a patient is selected.
      // Customers are labeled as "Name | Phone: 9999..." — split to get just the name.
      ...(isPharmacy && opt ? { patientName: opt.name || opt.label?.split(' | ')[0] || '' } : {}),
    }));
  };

  const handleSearchParamChange = (field, opt) => {
    const isArrayField = ['color', 'size'].includes(field);
    setSearchParams(prev => ({ ...prev, [field]: opt ? opt.value : (isArrayField ? [] : '') }));
  };

  const handleNewCustomer = async () => {
    try {
      const res = await createCustomer(newCustomerData);
      const newCust = { value: res.data.id, label: res.data.name, ...res.data };
      setCustomers([...customers, newCust]); setSelectedCustomer(newCust);
      setFormData(prev => ({ ...prev, customerId: res.data.id }));
      setOpenCustomerModal(false);
      setSnackbar({ open: true, message: isPharmacy ? 'Patient registered!' : 'Customer added!', severity: 'success' });
    } catch { setSnackbar({ open: true, message: 'Failed to add customer.', severity: 'error' }); }
  };

 const handleSaveDraft = async () => {
  setLoading(true);

  const payload = buildSalePayload(
    formData,
    selectedCustomer,
    [],          // no payments in draft
    "DRAFT"
  );

  try {
    const res = await draftSale(payload);
    setFormData(prev => ({ ...prev, id: res.data.id }));
    setSnackbar({ open: true, message: t('salesPage.draftSaved'), severity: 'success' });
  } catch {
    setSnackbar({ open: true, message: 'Failed to save draft', severity: 'error' });
  } finally {
    setLoading(false);
  }
};

const handleSubmitSale = async (payload) => {
  setLoading(true);
  try {
    const res = payload.id
      ? await completeDraftSale(payload.id, payload)
      : await createSale(payload);

    setLastSaleId(res.data.id);
    setLastInvoiceNo(res.data.invoiceNo);
    setSignedInvoiceUrl(res.data.signedInvoiceUrl);
    setLastCustomerPhone(selectedCustomer?.phone || null);
    setLastTotalAmount(res.data.totalAmount ?? formData.totalAmount ?? null);

    setFormData(initialFormData);
    setSelectedCustomer(null);
    setShowReviewPage(false);
    setOpenInvoiceModal(true);
    setUrlParams({});

    setSnackbar({
      open: true,
      message: `Sale #${res.data.invoiceNo} completed!`,
      severity: 'success'
    });
  } catch (err) {
    setSnackbar({
      open: true,
      message: err.response?.data?.message || 'Error processing sale.',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <Box sx={{ bgcolor: '#f4f6f8', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      <SalesTabs
        value={tabValue}
        onChange={(newValue) => {
          setUrlParams({ tab: newValue === 1 ? "history" : "sale" });
        }}
      />
      
      <SalesTabs.Panel value={tabValue} index={0} noPadding>
        {(loading || loadingCustomers) && !showReviewPage ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : !showReviewPage ? (
          /* ── TWO-COLUMN SPLIT PANEL LAYOUT ─────────────────────────────── */
          <Box sx={{
            display: { xs: 'block', md: 'flex' },
            gap: 1.5,
            height: { md: 'calc(100vh - 158px)' },
            overflow: 'hidden',
            px: { xs: 1, md: 0 },
            pt: { xs: 1, md: 0 },
          }}>

            {/* ── LEFT PANEL: Item Search & Selection ── */}
            <Paper elevation={0} sx={{
              flex: { md: '0 0 58%' },
              width: { xs: '100%', md: '58%' },
              borderRadius: 2,
              border: '1px solid #e0e4e8',
              overflow: 'auto',
              mb: { xs: 1.5, md: 0 },
            }}>
              <ItemSection
                variants={filteredVariants} selectedVariant={selectedVariant}
                item={item} setItem={setItem} uniqueNames={uniqueNames} uniqueSkus={uniqueSkus}
                uniqueColors={uniqueColors} uniqueSizes={uniqueSizes} uniqueDesigns={uniqueDesigns}
                uniqueCategory={uniqueCategory} uniqueFabrics={uniqueFabrics}
                uniqueSeasons={uniqueSeasons} uniqueFits={uniqueFits}
                uniqueCompositions={uniqueCompositions}
                handleResetFilters={handleResetFilters}
                searchParams={searchParams} handleVariantSelect={handleVariantSelect}
                handleSearchParamChange={handleSearchParamChange} handleAddItem={handleAddItem}
                error={itemError} editIndex={editIndex}
                substitutes={substitutes}
                isPharmacy={isPharmacy}
                industryType={industryType}
                onSelectSubstitute={(sub) => {
                  setSelectedVariant(sub);
                  setItem({ ...initialItem, id: sub.id, sku: sub.sku, qty: '1', unitPrice: sub.pricePerUnit, itemName: sub.itemName, currentStock: sub.currentStock, drugSchedule: sub.drugSchedule });
                  setSubstitutes([]);
                }}
              />
            </Paper>

            {/* ── RIGHT PANEL: Customer + Cart + Actions ── */}
            <Box sx={{
              flex: { md: '0 0 42%' },
              width: { xs: '100%', md: '42%' },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              gap: 0,
            }}>
              {/* Customer & GST section — compact header */}
              <Paper elevation={0} sx={{ borderRadius: '8px 8px 0 0', border: '1px solid #e0e4e8', borderBottom: 'none', p: 1.5, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {isPharmacy ? 'Patient' : 'Customer'}
                    {isPharmacy && <Chip label="Pharmacy" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                    {isJewellery && <Chip label="💎 Jewellery" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: '#ede9fe', color: '#7c3aed' }} />}
                  </Typography>
                </Box>
                <CustomerSection
                  compact
                  customers={customers} selectedCustomer={selectedCustomer}
                  formData={formData} setFormData={setFormData}
                  newCustomerData={newCustomerData} setNewCustomerData={setNewCustomerData}
                  handleCustomerSelect={handleCustomerSelect} handleNewCustomer={handleNewCustomer}
                  openCustomerModal={openCustomerModal} setOpenCustomerModal={setOpenCustomerModal}
                  isPharmacy={isPharmacy}
                  isJewellery={isJewellery}
                />
              </Paper>

              {/* Cart Summary — fills remaining height, items scroll internally */}
              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e0e4e8', borderTop: '1px solid #f1f5f9', bgcolor: '#fff' }}>
                <SalesSummary
                  embedded
                  hideActions
                  handleSaveDraft={handleSaveDraft}
                  formData={formData}
                  handleRemoveItem={handleRemoveItem}
                  handleEditItem={handleEditItem}
                  loading={loading}
                  setFormData={setFormData}
                  selectedCustomer={selectedCustomer}
                  setItem={setItem}
                  setShowReviewPage={setShowReviewPage}
                  handleCustomerSelect={handleCustomerSelect}
                  setSelectedVariant={setSelectedVariant}
                  setSearchParams={setSearchParams}
                  isPharmacy={isPharmacy}
                  isJewellery={isJewellery}
                />
              </Box>

              {/* Action bar — always visible at bottom of right panel */}
              <Paper elevation={0} sx={{
                borderRadius: '0 0 8px 8px',
                border: '1px solid #e0e4e8',
                borderTop: '2px solid #e2e8f0',
                p: 1.5,
                pr: { xs: '80px', md: '80px' },
                bgcolor: 'rgba(255,255,255,0.97)',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
              }}>
                {/* Totals summary */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', lineHeight: 1, mb: 0.25 }}>ITEMS</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                      {formData.items.length.toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ height: 28, my: 'auto' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', lineHeight: 1, mb: 0.25 }}>TOTAL</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1976d2', lineHeight: 1 }}>
                      ₹{Number(formData.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>

                {/* Right: Clear + Draft + Proceed */}
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Tooltip title="Clear all items">
                    <Button
                      variant="text"
                      color="inherit"
                      size="small"
                      onClick={() => {
                        if (formData.items.length === 0) return;
                        setFormData({ id: null, customerId: '', items: [], totalAmount: 0, isGstRequired: 'no', discount: 0, paymentMethods: [{ method: 'Cash', amount: 0 }], deliveryRequired: false });
                        handleCustomerSelect(null);
                        setSelectedVariant(null);
                        setItem(initialItem);
                        setSearchParams({});
                      }}
                      sx={{ minWidth: 0, px: 1 }}
                    >
                      <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption" fontWeight={700}>Clear</Typography>
                    </Button>
                  </Tooltip>

                  <Tooltip title={!selectedCustomer || formData.items.length === 0 ? 'Need customer + items' : ''}>
                    <span>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={handleSaveDraft}
                        disabled={loading || formData.items.length === 0 || !selectedCustomer}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5 }}
                      >
                        Draft
                      </Button>
                    </span>
                  </Tooltip>

                  {!formData.customerId && formData.items.length > 0 && (
                    <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                      Select customer
                    </Typography>
                  )}

                  <Tooltip title={
                    !formData.customerId ? 'Please select a customer first' :
                    !isDeliveryValid() ? 'Please complete delivery details (Address & Paid By)' : ''
                  }>
                    <span>
                      <Button
                        variant="contained"
                        size="medium"
                        endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ChevronRightIcon />}
                        disabled={formData.items.length === 0 || !formData.customerId || !isDeliveryValid() || loading}
                        onClick={() => {
                          const hasControlledDrug = isPharmacy && formData.items.some(it =>
                            ['SCHEDULE_H1', 'SCHEDULE_X'].includes(it.drugSchedule)
                          );
                          if (hasControlledDrug) {
                            const missing = [];
                            if (!formData.doctorName?.trim()) missing.push('Doctor Name');
                            if (!formData.doctorRegistrationNumber?.trim()) missing.push('Doctor Reg. No.');
                            if (!formData.patientName?.trim()) missing.push('Patient Name');
                            if (missing.length > 0) {
                              setSnackbar({ open: true, message: `Schedule H1/X drugs require: ${missing.join(', ')}. Fill in Prescription Details.`, severity: 'error' });
                              return;
                            }
                          }
                          setShowReviewPage(true);
                        }}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 800,
                          px: 2,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        }}
                      >
                        {loading ? 'Processing...' : t('salesPage.proceedToPayment')}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Paper>
            </Box>
          </Box>
        ) : (
          <ReviewPaymentPage
            formData={formData} selectedCustomer={selectedCustomer}
            onConfirm={handleSubmitSale} onSaveDraft={handleSaveDraft}
            onCancel={() => setShowReviewPage(false)}
            setError={msg => setSnackbar({ open: true, message: msg, severity: 'error' })}
            loading={loading}
            isPharmacy={isPharmacy}
          />
        )}

        <InvoiceModal
          open={openInvoiceModal} saleId={lastSaleId}
          invoiceNo={lastInvoiceNo} signedInvoiceUrl={signedInvoiceUrl}
          customerPhone={lastCustomerPhone} totalAmount={lastTotalAmount}
          shopName={shop?.name}
          onClose={handleCloseInvoiceModal}
        />
      </SalesTabs.Panel>

      <SalesTabs.Panel value={tabValue} index={1}>
        <SalesHistory onResume={handleLoadDraft} />
      </SalesTabs.Panel>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      {/* Drug Schedule Alert Dialog */}
      <Dialog open={drugAlertOpen} onClose={() => setDrugAlertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff7ed', color: '#92400e' }}>
          <WarningAmberIcon sx={{ color: '#d97706' }} />
          {pendingItem?.drugSchedule === 'SCHEDULE_X' ? 'Narcotic Drug — Strict Control' : 'Controlled Drug — Prescription Required'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{pendingItem?.itemName}</strong> is classified as <strong>{pendingItem?.drugSchedule?.replace('_', ' ')}</strong>.
          </Typography>
          {pendingItem?.drugSchedule === 'SCHEDULE_X' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              This sale will be recorded in the Narcotics Register as required by law. Ensure the patient has a valid prescription with doctor details.
            </Alert>
          )}
          {pendingItem?.drugSchedule === 'SCHEDULE_H1' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Schedule H1 drugs require strict verification. Confirm the patient has a valid prescription before proceeding.
            </Alert>
          )}
          {pendingItem?.drugSchedule === 'SCHEDULE_H' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This drug requires a valid prescription. Verify before adding to the bill.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            By clicking "Confirm & Add", you confirm that a valid prescription has been checked.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => { setDrugAlertOpen(false); setPendingItem(null); }} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setDrugAlertOpen(false);
              if (pendingItem) doAddItem(pendingItem);
              setPendingItem(null);
            }}
          >
            Confirm & Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;